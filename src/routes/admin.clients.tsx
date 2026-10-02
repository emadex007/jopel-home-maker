import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminListClients, deleteClient, moveClient, saveClient, type AdminClient } from "~/lib/admin-api";
import { cn, img } from "~/lib/ui";
import { AdminPage, Badge, Btn, EmptyState, ImageField, Modal, TextInput, Toggle, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/clients")({
  loader: () => adminListClients(),
  component: ClientsAdmin,
});

const EMPTY: AdminClient = { name: "", logo: "", url: "", active: 1 };

function ClientsAdmin() {
  const clients = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();
  const [edit, setEdit] = useState<AdminClient | null>(null);
  const refresh = () => router.invalidate();

  async function save() {
    if (!edit) return;
    const r = await run(() => saveClient({ data: edit }), edit.id ? "Saved" : "Logo added");
    if (r) {
      setEdit(null);
      refresh();
    }
  }

  const addBtn = <Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>+ Add logo</Btn>;

  return (
    <AdminPage
      title="Clients & partners"
      subtitle="Logos of companies you have worked with. They scroll across the home page."
      actions={addBtn}
    >
      {clients.length === 0 ? (
        <EmptyState
          title="No logos yet"
          text="Add the logos of real clients and partners (with their permission). The logo strip appears on the home page as soon as you add one."
          action={addBtn}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {clients.map((c, i) => (
            <li key={c.id} className={cn("flex flex-col rounded-xl border border-zinc-200 bg-white p-3", !c.active && "opacity-60")}>
              <button onClick={() => setEdit({ ...c })} className="flex h-24 items-center justify-center rounded-lg bg-zinc-50 p-3">
                <img src={img(c.logo, 400)} alt={c.name} className="max-h-full max-w-full object-contain" />
              </button>
              <p className="mt-2 truncate text-sm font-medium">{c.name}</p>
              <div className="mt-1 flex items-center justify-between">
                {c.active ? <Badge status="published">Showing</Badge> : <Badge status="hidden">Hidden</Badge>}
                <div className="flex">
                  <button aria-label="Move left" disabled={busy || i === 0} onClick={() => run(() => moveClient({ data: { id: c.id, dir: -1 } })).then(refresh)} className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">◀</button>
                  <button aria-label="Move right" disabled={busy || i === clients.length - 1} onClick={() => run(() => moveClient({ data: { id: c.id, dir: 1 } })).then(refresh)} className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">▶</button>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Btn size="sm" className="flex-1" onClick={() => setEdit({ ...c })}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => confirm(`Remove ${c.name}?`) && run(() => deleteClient({ data: c.id }), "Removed").then(refresh)}>
                  Remove
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-zinc-500">Tip: transparent PNG logos look best. They show in grey and turn to full colour when a visitor hovers over them.</p>

      <Modal
        open={!!edit}
        title={edit?.id ? "Edit logo" : "Add a client or partner"}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Btn onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <TextInput label="Company name *" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <ImageField label="Logo *" value={edit.logo} onChange={(v) => setEdit({ ...edit, logo: v })} aspect="aspect-[3/2]" />
            <TextInput label="Website (optional)" hint="If added, the logo links to their website." value={edit.url} onChange={(v) => setEdit({ ...edit, url: v })} placeholder="https://" />
            <Toggle label="Show on website" checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v ? 1 : 0 })} />
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
