import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Upload, X } from "lucide-react";
import { api, qs } from "../lib/api";
import { Button, Modal, Spinner, cn, useErrorToast } from "./ui";

export interface MediaItem {
  id: string;
  url: string;
  alt: string;
  originalName: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  variants: { url: string; width: number }[];
  createdAt: string;
}

export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif";

export function useUpload() {
  const qc = useQueryClient();
  const onErr = useErrorToast();
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File, alt = "") => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", alt);
      const m = await api.upload<MediaItem>("/admin/media", fd);
      void qc.invalidateQueries({ queryKey: ["media"] });
      return m;
    } catch (e) {
      onErr(e);
      return null;
    } finally {
      setUploading(false);
    }
  };
  return { upload, uploading };
}

export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (m: MediaItem) => void }) {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["media", q], queryFn: () => api.get<MediaItem[]>(`/admin/media${qs({ q, pageSize: 60 })}`), enabled: open });
  const { upload, uploading } = useUpload();
  const input = useRef<HTMLInputElement>(null);
  return (
    <Modal open={open} onClose={onClose} title="Choose an image" wide>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Search by file name or alt text" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="secondary" loading={uploading} onClick={() => input.current?.click()}>
          <Upload className="size-4" /> Upload
        </Button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const alt = window.prompt("Describe the image (alt text, for accessibility & SEO):", "") ?? "";
            const m = await upload(f, alt);
            if (m) onPick(m);
          }}
        />
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data?.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onPick(m)} className="group block w-full overflow-hidden rounded-lg ring-1 ring-slate-200 hover:ring-2 hover:ring-brand-500">
                <img src={m.variants[0]?.url ?? m.url} alt={m.alt} className="aspect-video w-full bg-slate-100 object-cover" loading="lazy" />
                <span className="block truncate px-2 py-1 text-left text-xs text-slate-600">{m.alt || m.originalName}</span>
              </button>
            </li>
          ))}
          {!data?.length && <li className="col-span-full py-10 text-center text-sm text-slate-500">No images yet — upload one.</li>}
        </ul>
      )}
    </Modal>
  );
}

/** Form field storing a media id, with preview. */
export function MediaField({ label, value, onChange, media }: { label: string; value: string | null; onChange: (id: string | null, m?: MediaItem) => void; media?: { url: string; alt: string } | null }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ url: string; alt: string } | null>(media ?? null);
  useEffect(() => {
    if (media) setPicked(media);
  }, [media?.url]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = value ? picked : null;
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className={cn("flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-3", preview && "border-solid")}>
        {preview ? (
          <img src={preview.url} alt={preview.alt} className="h-16 w-28 rounded object-cover ring-1 ring-slate-200" />
        ) : (
          <span className="grid h-16 w-28 place-items-center rounded bg-slate-50 text-slate-400">
            <ImagePlus className="size-6" />
          </span>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose image"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="size-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(m) => {
          setPicked({ url: m.variants[0]?.url ?? m.url, alt: m.alt });
          onChange(m.id, m);
          setOpen(false);
        }}
      />
    </div>
  );
}
