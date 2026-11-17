import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { prisma, KeywordIntent, KeywordPriority, KeywordRole, KeywordStatus } from "../db.js";

export const normalizeKeyword = (k: string) => k.toLowerCase().replace(/\s+/g, " ").trim();

const STOP = new Set(["near", "me", "in", "the", "a", "for", "my", "best", "local", "services", "service", "company", "companies", "professional", "top", "affordable", "cheap"]);

/**
 * Intent signature used to detect cannibalization: "Water heater installations near me" and
 * "water heater installation" share a signature, so they should live on the same page.
 */
export function intentSignature(k: string) {
  return normalizeKeyword(k)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .sort()
    .join(" ");
}

type Row = Record<string, string>;

const HEADER_ALIASES: Record<string, string[]> = {
  keyword: ["keyword", "keywords", "search term", "query"],
  volume: ["monthly us volume", "monthly volume", "volume", "search volume", "avg monthly searches"],
  kd: ["kd", "keyword difficulty", "difficulty"],
  cpc: ["cpc (usd)", "cpc", "cost per click"],
  intent: ["intent", "search intent"],
  category: ["category", "group"],
  priority: ["priority"],
  target: ["target page", "target", "page"],
  role: ["primary/secondary", "role", "type"],
  status: ["status"],
  source: ["source", "source / notes"],
  notes: ["notes"],
};

function mapHeader(cells: string[]) {
  const map: Record<number, string> = {};
  cells.forEach((c, i) => {
    const v = c.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) if (aliases.includes(v) && !Object.values(map).includes(field)) map[i] = field;
  });
  return Object.values(map).includes("keyword") ? map : null;
}

/** Walks rows; a row whose first column is "Keyword" starts a new table (sheets often contain several sections). */
function rowsToRecords(rows: string[][]): Row[] {
  const out: Row[] = [];
  let header: Record<number, string> | null = null;
  for (const cells of rows) {
    const maybe = mapHeader(cells);
    if (maybe) {
      header = maybe;
      continue;
    }
    if (!header) continue;
    const rec: Row = {};
    for (const [i, field] of Object.entries(header)) rec[field] = (cells[Number(i)] ?? "").trim();
    if (rec.keyword) out.push(rec);
  }
  return out;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return String(v.result ?? "");
    if ("text" in v) return String(v.text);
    if (v instanceof Date) return v.toISOString();
  }
  return String(v);
}

export async function parseKeywordFile(buffer: Buffer, filename: string): Promise<Row[]> {
  if (/\.csv$/i.test(filename)) {
    const rows = parseCsv(buffer, { relax_column_count: true, skip_empty_lines: true, bom: true }) as string[][];
    return rowsToRecords(rows);
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const all: Row[] = [];
  wb.eachSheet((ws) => {
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals = row.values as ExcelJS.CellValue[];
      rows.push(vals.slice(1).map(cellText));
    });
    all.push(...rowsToRecords(rows));
  });
  return all;
}

const num = (s?: string) => {
  if (!s) return null;
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const enumOf = <T extends Record<string, string>>(e: T, s?: string) => {
  const v = s?.trim().toUpperCase();
  return v && v in e ? (e[v as keyof T] as T[keyof T]) : undefined;
};

/** Upserts keywords; never overwrites an existing page assignment. */
export async function importKeywords(records: Row[], filename: string, userId: string | null) {
  const imp = await prisma.keywordImport.create({ data: { filename, rowCount: records.length, createdCount: 0, updatedCount: 0, skippedCount: 0, createdById: userId || null } });
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const seen = new Set<string>();

  for (const r of records) {
    const keyword = r.keyword.replace(/\s+/g, " ").trim();
    const normalized = normalizeKeyword(keyword);
    if (!normalized || normalized.length > 150 || /^(tip|note)\b[:\s]/i.test(keyword) || seen.has(normalized)) {
      skippedCount++;
      continue;
    }
    seen.add(normalized);
    const data = {
      keyword,
      monthlyVolume: num(r.volume) !== null ? Math.round(num(r.volume)!) : undefined,
      difficulty: num(r.kd) ?? undefined,
      cpc: num(r.cpc) ?? undefined,
      intent: enumOf(KeywordIntent, r.intent),
      category: r.category || undefined,
      priority: enumOf(KeywordPriority, r.priority),
      targetHint: r.target || undefined,
      source: r.source || undefined,
      notes: r.notes || undefined,
    };
    const existing = await prisma.keyword.findUnique({ where: { normalized } });
    if (existing) {
      // Fill gaps / refresh metrics, keep assignment & editorial status
      await prisma.keyword.update({ where: { id: existing.id }, data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) });
      updatedCount++;
    } else {
      await prisma.keyword.create({
        data: {
          ...data,
          normalized,
          role: enumOf(KeywordRole, r.role),
          status: enumOf(KeywordStatus, r.status) ?? KeywordStatus.UNASSIGNED,
          importId: imp.id,
        },
      });
      createdCount++;
    }
  }
  return prisma.keywordImport.update({ where: { id: imp.id }, data: { createdCount, updatedCount, skippedCount } });
}
