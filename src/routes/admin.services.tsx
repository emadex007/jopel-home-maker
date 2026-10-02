import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminListServices, deleteService, moveService, saveService, type AdminService } from "~/lib/admin-api";
import { img } from "~/lib/ui";
import { AdminPage, Badge, Btn, EmptyState, ImageField, Modal, TextArea, TextInput, Toggle, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/services")({
  loader: () => adminListServices(),
  component: ServicesAdmin,
});

const EMPTY: AdminService = { title: "", summary: "", description: "", image: "", active: 1 };

function ServicesAdmin() {
  const services = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();
  const [edit, setEdit] = useState<AdminService | null>(null);
  const refresh = () => router.invalidate();

  async function save() {
    if (!edit) return;
    const r = await run(() => saveService({ data: edit }), edit.id ? "Service saved" : "Service added");
    if (r) {
      setEdit(null);
      refresh();
    }
  }

  return (
    <AdminPage
      title="Services"
      subtitle="What Jo-pearl offers. Shown on the Services page, the home page and the booking form."
      actions={<Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>+ New service</Btn>}
    >
      {services.length === 0 ? (
        <EmptyState title="No services yet" action={<Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>Add a service</Btn>} />
      ) : (
        <ul className="space-y-2">
          {services.map((sv, i) => (
            <li key={sv.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 md:gap-4">
              <div className="flex flex-col">
                <button aria-label="Move up" disabled={busy || i === 0} onClick={() => run(() => moveService({ data: { id: sv.id, dir: -1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▲</button>
                <button aria-label="Move down" disabled={busy || i === services.length - 1} onClick={() => run(() => moveService({ data: { id: sv.id, dir: 1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▼</button>
              </div>
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">{sv.image && <img src={img(sv.image, 300)} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{sv.title}</p>
                <p className="truncate text-xs text-zinc-500">{sv.summary}</p>
                {!sv.active && <div className="mt-1"><Badge status="hidden">Hidden</Badge></div>}
              </div>
              <Btn size="sm" onClick={() => setEdit({ ...sv })}>Edit</Btn>
              <Btn
                size="sm"
                variant="danger"
                className="hidden sm:inline-flex"
                onClick={() => {
                  if (confirm(`Delete "${sv.title}"?`)) run(() => deleteService({ data: sv.id }), "Service deleted").then(refresh);
                }}
              >
                Delete
              </Btn>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!edit}
        title={edit?.id ? "Edit service" : "New service"}
        onClose={() => setEdit(null)}
        wide
        footer={
          <>
            {edit?.id && (
              <Btn
                variant="danger"
                className="mr-auto sm:hidden"
                onClick={() => {
                  if (edit?.id && confirm("Delete this service?")) run(() => deleteService({ data: edit.id! }), "Service deleted").then(() => (setEdit(null), refresh()));
                }}
              >
                Delete
              </Btn>
            )}
            <Btn onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <TextInput label="Service name *" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} />
            <TextInput label="Short summary" value={edit.summary} onChange={(v) => setEdit({ ...edit, summary: v })} />
            <TextArea label="Description" rows={5} value={edit.description} onChange={(v) => setEdit({ ...edit, description: v })} />
            <ImageField label="Image" value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} aspect="aspect-[4/3]" />
            <Toggle label="Show on website" checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v ? 1 : 0 })} />
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
