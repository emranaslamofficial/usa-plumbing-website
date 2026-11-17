import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, qs } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Empty, ErrorBox, Field, Modal, PageHeader, Spinner, Table, Td, Toggle, fieldError, useErrorToast, useToast } from "./ui";
import { MediaField } from "./MediaPicker";

export type FieldDef =
  | { name: string; label: string; type: "text" | "textarea" | "number" | "date" | "email" | "url"; required?: boolean; hint?: string; placeholder?: string }
  | { name: string; label: string; type: "checkbox"; hint?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; required?: boolean; hint?: string; nullable?: boolean }
  | { name: string; label: string; type: "media"; hint?: string };

export interface ResourceConfig {
  title: string;
  description?: ReactNode;
  endpoint: string; // e.g. "/admin/tags"
  query?: Record<string, string>;
  columns: { label: string; render: (row: Record<string, any>) => ReactNode }[];
  fields: FieldDef[];
  defaults?: Record<string, unknown>;
  writePerm: string;
  /** Map row → form values when editing */
  toForm?: (row: Record<string, any>) => Record<string, unknown>;
  /** Map form values → request body */
  toBody?: (v: Record<string, any>) => Record<string, unknown>;
  createLabel?: string;
  embedded?: boolean;
}

export function ResourcePage(c: ResourceConfig) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const key = [c.endpoint, c.query];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.get<Record<string, any>[]>(`${c.endpoint}${qs({ pageSize: 500, ...c.query })}`) });
  const [editing, setEditing] = useState<{ id?: string; values: Record<string, any> } | null>(null);
  const canWrite = can(c.writePerm);

  const save = useMutation({
    mutationFn: (e: { id?: string; values: Record<string, any> }) => {
      const body = c.toBody ? c.toBody(e.values) : e.values;
      return e.id ? api.patch(`${c.endpoint}/${e.id}`, body) : api.post(c.endpoint, body);
    },
    onSuccess: () => {
      toast("Saved");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: [c.endpoint] });
    },
  });

  const remove = async (row: Record<string, any>) => {
    if (!(await confirm("Delete this item? This cannot be undone.", { danger: true, confirmLabel: "Delete" }))) return;
    try {
      await api.del(`${c.endpoint}/${row.id}`);
      toast("Deleted");
      void qc.invalidateQueries({ queryKey: [c.endpoint] });
    } catch (e) {
      onErr(e);
    }
  };

  const openNew = () => setEditing({ values: { ...(c.defaults ?? {}) } });
  const openEdit = (row: Record<string, any>) => setEditing({ id: row.id, values: c.toForm ? c.toForm(row) : { ...row } });
  const set = (name: string, v: unknown) => setEditing((e) => e && { ...e, values: { ...e.values, [name]: v } });

  return (
    <div>
      {!c.embedded ? (
        <PageHeader
          title={c.title}
          description={c.description}
          actions={
            canWrite && (
              <Button onClick={openNew}>
                <Plus className="size-4" /> {c.createLabel ?? "Add new"}
              </Button>
            )
          }
        />
      ) : (
        canWrite && (
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={openNew}>
              <Plus className="size-4" /> {c.createLabel ?? "Add new"}
            </Button>
          </div>
        )
      )}
      <ErrorBox error={error} />
      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <div className="rounded-xl bg-white ring-1 ring-slate-200">
          <Empty title="Nothing here yet">{canWrite && "Use “Add new” to create the first one."}</Empty>
        </div>
      ) : (
        <Table head={[...c.columns.map((col) => col.label), ""]}>
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {c.columns.map((col) => (
                <Td key={col.label}>{col.render(row)}</Td>
              ))}
              <Td className="whitespace-nowrap text-right">
                {canWrite && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void remove(row)} aria-label="Delete">
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${c.title.replace(/s$/, "")}` : (c.createLabel ?? `New ${c.title.replace(/s$/, "")}`)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={save.isPending} onClick={() => editing && save.mutate(editing)}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(editing);
            }}
          >
            {save.error && <ErrorBox error={save.error} />}
            {c.fields.map((f) => {
              const v = editing.values[f.name];
              const err = fieldError(save.error, f.name);
              if (f.type === "checkbox") return <Toggle key={f.name} label={f.label} description={f.hint} checked={Boolean(v)} onChange={(x) => set(f.name, x)} />;
              if (f.type === "media") return <MediaField key={f.name} label={f.label} value={v ?? null} onChange={(id) => set(f.name, id)} />;
              return (
                <Field key={f.name} label={f.label} required={"required" in f && f.required} error={err} hint={f.hint}>
                  {f.type === "textarea" ? (
                    <textarea className="input" rows={4} value={v ?? ""} onChange={(e) => set(f.name, e.target.value)} />
                  ) : f.type === "select" ? (
                    <select className="input" value={v ?? ""} onChange={(e) => set(f.name, e.target.value === "" && f.nullable ? null : e.target.value)}>
                      {f.nullable && <option value="">—</option>}
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      type={f.type}
                      placeholder={"placeholder" in f ? f.placeholder : undefined}
                      value={f.type === "date" && v ? String(v).slice(0, 10) : (v ?? "")}
                      onChange={(e) => set(f.name, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value === "" ? null : e.target.value)}
                    />
                  )}
                </Field>
              );
            })}
          </form>
        )}
      </Modal>
    </div>
  );
}
