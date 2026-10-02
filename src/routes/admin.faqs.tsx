import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminListFaqs, deleteFaq, moveFaq, saveFaq, type AdminFaq } from "~/lib/admin-api";
import { AdminPage, Badge, Btn, EmptyState, Modal, TextArea, TextInput, Toggle, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/faqs")({
  loader: () => adminListFaqs(),
  component: FaqsAdmin,
});

const EMPTY: AdminFaq = { question: "", answer: "", active: 1 };

function FaqsAdmin() {
  const items = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();
  const [edit, setEdit] = useState<AdminFaq | null>(null);
  const refresh = () => router.invalidate();

  async function save() {
    if (!edit) return;
    const r = await run(() => saveFaq({ data: edit }), "FAQ saved");
    if (r) {
      setEdit(null);
      refresh();
    }
  }

  const addBtn = <Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>+ New question</Btn>;

  return (
    <AdminPage
      title="FAQs"
      subtitle="Questions clients often ask. Shown on the home and contact pages, and to Google. Check the starter answers match how you work."
      actions={addBtn}
    >
      {items.length === 0 ? (
        <EmptyState title="No questions yet" action={addBtn} />
      ) : (
        <ul className="space-y-2">
          {items.map((f, i) => (
            <li key={f.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col">
                <button aria-label="Move up" disabled={busy || i === 0} onClick={() => run(() => moveFaq({ data: { id: f.id, dir: -1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▲</button>
                <button aria-label="Move down" disabled={busy || i === items.length - 1} onClick={() => run(() => moveFaq({ data: { id: f.id, dir: 1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{f.question}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{f.answer}</p>
                {!f.active && <div className="mt-1"><Badge status="hidden">Hidden</Badge></div>}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Btn size="sm" onClick={() => setEdit({ ...f })}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => confirm("Delete this question?") && run(() => deleteFaq({ data: f.id }), "Deleted").then(refresh)}>
                  Delete
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!edit}
        title={edit?.id ? "Edit question" : "New question"}
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
            <TextInput label="Question *" value={edit.question} onChange={(v) => setEdit({ ...edit, question: v })} />
            <TextArea label="Answer *" rows={6} value={edit.answer} onChange={(v) => setEdit({ ...edit, answer: v })} />
            <Toggle label="Show on website" checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v ? 1 : 0 })} />
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
