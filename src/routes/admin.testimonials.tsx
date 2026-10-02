import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminListTestimonials, deleteTestimonial, moveTestimonial, saveTestimonial, type AdminTestimonial } from "~/lib/admin-api";
import { AdminPage, Badge, Btn, EmptyState, Modal, TextArea, TextInput, Toggle, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/testimonials")({
  loader: () => adminListTestimonials(),
  component: TestimonialsAdmin,
});

const EMPTY: AdminTestimonial = { name: "", role: "", quote: "", active: 1 };

function TestimonialsAdmin() {
  const items = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();
  const [edit, setEdit] = useState<AdminTestimonial | null>(null);
  const refresh = () => router.invalidate();

  async function save() {
    if (!edit) return;
    const r = await run(() => saveTestimonial({ data: edit }), "Testimonial saved");
    if (r) {
      setEdit(null);
      refresh();
    }
  }

  return (
    <AdminPage
      title="Testimonials"
      subtitle="Real reviews from your clients. They slide across the home page once at least one is switched on. Edit the SAMPLE templates with real clients' words (with their permission), then switch them on."
      actions={<Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>+ New testimonial</Btn>}
    >
      {items.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          text="Ask happy clients for a sentence or two about working with you, then add their words here with their permission."
          action={<Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>Add a testimonial</Btn>}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((t, i) => (
            <li key={t.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col">
                <button aria-label="Move up" disabled={busy || i === 0} onClick={() => run(() => moveTestimonial({ data: { id: t.id, dir: -1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▲</button>
                <button aria-label="Move down" disabled={busy || i === items.length - 1} onClick={() => run(() => moveTestimonial({ data: { id: t.id, dir: 1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-zinc-800">“{t.quote}”</p>
                <p className="mt-2 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700">{t.name}</span>
                  {t.role && ` · ${t.role}`}
                </p>
                {!t.active && <div className="mt-1"><Badge status="hidden">Hidden</Badge></div>}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Btn size="sm" onClick={() => setEdit({ ...t })}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => confirm("Delete this testimonial?") && run(() => deleteTestimonial({ data: t.id }), "Deleted").then(refresh)}>
                  Delete
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!edit}
        title={edit?.id ? "Edit testimonial" : "New testimonial"}
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
            <TextArea label="What the client said *" rows={4} value={edit.quote} onChange={(v) => setEdit({ ...edit, quote: v })} />
            <TextInput label="Client name *" hint="e.g. Mrs. Ada O." value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <TextInput label="Role / location" hint="e.g. Homeowner, Abuja" value={edit.role} onChange={(v) => setEdit({ ...edit, role: v })} />
            <Toggle label="Show on website" checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v ? 1 : 0 })} />
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
