import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { deleteInboxItem, getInbox, setInboxStatus, type InboxTab } from "~/lib/admin-api";
import { cn, img, phoneDigits, useSite, waLink } from "~/lib/ui";
import { AdminPage, Badge, Btn, EmptyState, Modal, fmtDate, useAction } from "~/components/admin/kit";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "~/components/Icons";

type Search = { tab?: InboxTab; status?: string };

export const Route = createFileRoute("/admin/inbox")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: s.tab === "quotes" || s.tab === "messages" || s.tab === "bookings" ? s.tab : undefined,
    status: typeof s.status === "string" && s.status ? s.status : undefined,
  }),
  loaderDeps: ({ search }) => ({ tab: search.tab ?? ("bookings" as InboxTab), status: search.status }),
  loader: ({ deps }) => getInbox({ data: deps }),
  component: Inbox,
});

type Row = Record<string, string | number>;

const STATUSES: Record<InboxTab, string[]> = {
  bookings: ["new", "confirmed", "done", "cancelled"],
  quotes: ["new", "quoted", "won", "lost"],
  messages: ["unread", "read"],
};

const TAB_LABEL: Record<InboxTab, string> = { bookings: "Bookings", quotes: "Quote requests", messages: "Messages & emails" };

function Inbox() {
  const { items } = Route.useLoaderData();
  const search = Route.useSearch();
  const tab: InboxTab = search.tab ?? "bookings";
  const status = search.status;
  const navigate = useNavigate({ from: "/admin/inbox" });
  const router = useRouter();
  const { busy, run } = useAction();
  const [openId, setOpenId] = useState<number | null>(null);
  const open = items.find((i) => Number(i.id) === openId) ?? null;
  useEffect(() => setOpenId(null), [tab, status]);

  const rowStatus = (r: Row) => (tab === "messages" ? (r.is_read ? "read" : "unread") : String(r.status));

  async function changeStatus(r: Row, s: string) {
    await run(() => setInboxStatus({ data: { tab, id: Number(r.id), status: s } }), "Updated");
    router.invalidate();
  }

  async function openItem(r: Row) {
    setOpenId(Number(r.id));
    if (tab === "messages" && !r.is_read) {
      await setInboxStatus({ data: { tab, id: Number(r.id), status: "read" } });
      router.invalidate();
    }
  }

  return (
    <AdminPage title="Inbox" subtitle="Everything people send from the website, plus emails to your business address.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
          {(Object.keys(TAB_LABEL) as InboxTab[]).map((t) => (
            <button
              key={t}
              onClick={() => navigate({ search: { tab: t } })}
              className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium", t === tab ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <select
          value={status ?? ""}
          onChange={(e) => navigate({ search: { tab, status: e.target.value || undefined } })}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm capitalize"
        >
          <option value="">All</option>
          {STATUSES[tab].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <EmptyState title={`No ${TAB_LABEL[tab].toLowerCase()} ${status ? `marked "${status}"` : "yet"}`} text="New ones will show up here, and you'll get an email if notifications are set up." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {items.map((r) => (
              <li key={r.id}>
                <button onClick={() => openItem(r)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-zinc-50">
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", tab === "messages" && !r.is_read ? "font-semibold" : "font-medium")}>
                      {tab === "messages" ? r.subject || "(no subject)" : r.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {tab === "bookings" && [r.service || "Consultation", r.visit_type, `${r.preferred_date} ${r.preferred_time}`].filter(Boolean).join(" · ")}
                      {tab === "quotes" && [r.project_type, r.spaces, r.budget].filter(Boolean).join(" · ")}
                      {tab === "messages" && [r.name || r.email, r.source === "email" ? "Email" : "Website form"].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">{fmtDate(r.created_at)}</span>
                  <Badge status={rowStatus(r)} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={!!open}
        wide
        title={open ? (tab === "messages" ? String(open.subject || "Message") : `${open.ref} · ${open.name}`) : ""}
        onClose={() => setOpenId(null)}
        footer={
          open && (
            <>
              <Btn
                variant="danger"
                className="mr-auto"
                onClick={async () => {
                  if (!confirm("Delete this permanently?")) return;
                  await run(() => deleteInboxItem({ data: { tab, id: Number(open.id) } }), "Deleted");
                  setOpenId(null);
                  router.invalidate();
                }}
              >
                Delete
              </Btn>
              <select
                value={rowStatus(open)}
                disabled={busy}
                onChange={(e) => changeStatus(open, e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm capitalize"
              >
                {STATUSES[tab].map((s) => (
                  <option key={s} value={s}>Mark as {s}</option>
                ))}
              </select>
            </>
          )
        }
      >
        {open && <Detail tab={tab} r={open} />}
      </Modal>
    </AdminPage>
  );
}

function Detail({ tab, r }: { tab: InboxTab; r: Row }) {
  const s = useSite();
  const phone = String(r.phone ?? "");
  const email = String(r.email ?? "");
  const firstName = String(r.name ?? "").split(" ")[0];
  const waText =
    tab === "bookings"
      ? `Hello ${firstName}, this is ${s.brand.name}. Thank you for booking a consultation (ref ${r.ref}).`
      : tab === "quotes"
        ? `Hello ${firstName}, this is ${s.brand.name}. Thank you for your quote request (ref ${r.ref}).`
        : `Hello ${firstName}, this is ${s.brand.name}. Thank you for your message.`;
  const subject = tab === "messages" ? `Re: ${r.subject || "Your message"}` : `${s.brand.name}: ${r.ref}`;

  const rows: [string, unknown][] =
    tab === "bookings"
      ? [
          ["Service", r.service],
          ["Type", r.visit_type],
          ["Preferred date", r.preferred_date],
          ["Preferred time", r.preferred_time],
          ["Address", r.address],
          ["Notes", r.notes],
        ]
      : tab === "quotes"
        ? [
            ["Project type", r.project_type],
            ["Spaces", r.spaces],
            ["Size", r.size],
            ["Budget", r.budget],
            ["Style", r.style],
            ["Location", r.location],
            ["Timeline", r.timeline],
            ["Details", r.details],
          ]
        : [
            ["From", [r.name, r.email].filter(Boolean).join(" · ")],
            ["Phone", r.phone],
            ["Received via", r.source === "email" ? "Email" : "Website contact form"],
            ["Message", r.body],
          ];

  let attachments: string[] = [];
  try {
    attachments = tab === "quotes" ? (JSON.parse(String(r.attachments || "[]")) as string[]) : [];
  } catch {
    /* ignore */
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {phone && (
          <a href={waLink(phone, waText)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white">
            <WhatsAppIcon size={16} /> WhatsApp
          </a>
        )}
        {phone && (
          <a href={`tel:+${phoneDigits(phone)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            <PhoneIcon size={16} /> {phone}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            <MailIcon size={16} /> {email}
          </a>
        )}
      </div>
      <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[140px_1fr]">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="whitespace-pre-wrap break-words">{String(v)}</dd>
            </div>
          ))}
        <div className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-zinc-500">Received</dt>
          <dd>{fmtDate(r.created_at)}</dd>
        </div>
      </dl>
      {attachments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-700">Photos from the client</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {attachments.map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden rounded-lg bg-zinc-100">
                <img src={img(u, 400)} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
      {tab === "quotes" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 p-4">
          <p className="flex-1 text-sm text-zinc-600">Ready to price this job? Create a quotation pre-filled with this client's details.</p>
          <Link to="/admin/quotes/$id" params={{ id: "new" }} search={{ from: Number(r.id) }} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
            Create quotation
          </Link>
        </div>
      )}
    </div>
  );
}
