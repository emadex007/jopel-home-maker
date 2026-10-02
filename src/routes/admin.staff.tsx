import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { changeMyPassword, deleteStaff, listStaff, saveStaff } from "~/lib/admin-api";
import { AdminPage, Badge, Btn, Card, Modal, SelectInput, TextInput, Toggle, fmtDate, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/staff")({
  loader: () => listStaff(),
  component: StaffPage,
});

type StaffForm = { id?: number; name: string; email: string; role: string; password: string; active: boolean };
const EMPTY: StaffForm = { name: "", email: "", role: "staff", password: "", active: true };

function StaffPage() {
  const { me, staff } = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();
  const [edit, setEdit] = useState<StaffForm | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const isOwner = me.role === "owner";

  async function save() {
    if (!edit) return;
    const r = await run(() => saveStaff({ data: edit }), edit.id ? "Account updated" : "Account created");
    if (r) {
      setEdit(null);
      router.invalidate();
    }
  }

  return (
    <AdminPage
      title="Staff & account"
      subtitle={isOwner ? "Give team members their own login to the dashboard." : "Your account settings."}
      actions={isOwner ? <Btn variant="primary" onClick={() => setEdit({ ...EMPTY })}>+ Add staff</Btn> : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Team">
            <ul className="divide-y divide-zinc-100">
              {staff.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                    {u.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.name} {u.id === me.id && <span className="text-zinc-400">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{u.email} · added {fmtDate(u.created_at, false)}</p>
                  </div>
                  <Badge status={u.role === "owner" ? "featured" : "read"}>{u.role}</Badge>
                  {!u.active && <Badge status="cancelled">Disabled</Badge>}
                  {isOwner && (
                    <Btn size="sm" onClick={() => setEdit({ id: u.id, name: u.name, email: u.email, role: u.role, password: "", active: !!u.active })}>
                      Edit
                    </Btn>
                  )}
                </li>
              ))}
            </ul>
            {!isOwner && <p className="mt-3 text-xs text-zinc-500">Only the owner can add or change staff accounts.</p>}
          </Card>
        </div>

        <Card title="Change my password">
          <div className="space-y-3">
            <TextInput label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} />
            <TextInput label="New password" hint="At least 8 characters." type="password" autoComplete="new-password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} />
            <Btn
              variant="primary"
              disabled={busy || !pw.current || pw.next.length < 8}
              onClick={async () => {
                const r = await run(() => changeMyPassword({ data: pw }), "Password changed");
                if (r) setPw({ current: "", next: "" });
              }}
            >
              Update password
            </Btn>
          </div>
        </Card>
      </div>

      <Modal
        open={!!edit}
        title={edit?.id ? "Edit account" : "New staff account"}
        onClose={() => setEdit(null)}
        footer={
          <>
            {edit?.id && edit.id !== me.id && (
              <Btn
                variant="danger"
                className="mr-auto"
                onClick={async () => {
                  if (!confirm(`Delete ${edit.name}'s account?`)) return;
                  const r = await run(() => deleteStaff({ data: edit.id! }), "Account deleted");
                  if (r) {
                    setEdit(null);
                    router.invalidate();
                  }
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
            <TextInput label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <TextInput label="Email (used to log in)" type="email" value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} />
            <TextInput
              label={edit.id ? "New password" : "Password"}
              hint={edit.id ? "Leave empty to keep their current password." : "At least 8 characters. Share it with them privately."}
              type="text"
              autoComplete="new-password"
              value={edit.password}
              onChange={(v) => setEdit({ ...edit, password: v })}
            />
            <SelectInput
              label="Role"
              value={edit.role}
              onChange={(v) => setEdit({ ...edit, role: v })}
              options={[
                { value: "staff", label: "Staff: manage projects, inbox and settings" },
                { value: "owner", label: "Owner: everything, including staff accounts" },
              ]}
            />
            <Toggle label="Account active" hint="Turn off to block this person from logging in." checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
