import { createFileRoute, useRouter } from "@tanstack/react-router";
import { adminBackupNow, adminListBackups } from "~/lib/admin-api";
import { AdminPage, Btn, Card, EmptyState, fmtDate, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/backups")({
  loader: () => adminListBackups(),
  component: BackupsPage,
});

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function BackupsPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();

  if (!data.allowed) {
    return (
      <AdminPage title="Backups">
        <EmptyState title="Owner only" text="Only the owner account can see and download backups." />
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Backups"
      subtitle="A copy of all website content and enquiries is saved automatically every Monday. The 8 most recent are kept."
      actions={
        <Btn
          variant="primary"
          disabled={busy}
          onClick={async () => {
            const r = await run(() => adminBackupNow(), "Backup saved");
            if (r) router.invalidate();
          }}
        >
          {busy ? "Backing up…" : "Back up now"}
        </Btn>
      }
    >
      {data.backups.length === 0 ? (
        <EmptyState title="No backups yet" text="The first automatic backup runs next Monday. Click 'Back up now' to make one straight away." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {data.backups.map((b) => (
              <li key={b.key} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fmtDate(b.uploaded)}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {b.name.includes("_manual") ? "Manual" : "Automatic"} · {size(b.size)}
                  </p>
                </div>
                <a href={`/api/admin/backup?name=${encodeURIComponent(b.name)}`} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card title="Restoring a backup" className="mt-6">
        <div className="space-y-3 text-sm leading-relaxed text-zinc-600">
          <p>Restoring replaces the current content with the backup, so it's done by your web developer from their computer:</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">npx wrangler d1 execute &lt;database_name&gt; --remote --file &lt;downloaded-backup&gt;.sql</pre>
          <p>Backups include projects, services, testimonials, FAQs, settings, staff accounts, bookings, quote requests, quotations, messages and chats. Photos are stored separately in Cloudflare R2 and aren't deleted when content is removed from a backup.</p>
          <p className="text-zinc-500">Backups contain clients' contact details, so keep downloaded files private.</p>
        </div>
      </Card>
    </AdminPage>
  );
}
