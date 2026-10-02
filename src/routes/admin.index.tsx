import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "~/lib/admin-api";
import { AdminPage, Badge, Card, fmtDate } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/")({
  loader: () => getDashboard(),
  component: Dashboard,
});

function Stat({ label, value, tab, highlight }: { label: string; value: number; tab?: "bookings" | "quotes" | "messages"; highlight?: boolean }) {
  const cls = "rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400";
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${highlight && value > 0 ? "text-amber-600" : "text-zinc-900"}`}>{value ?? 0}</p>
    </>
  );
  return tab ? (
    <Link to="/admin/inbox" search={{ tab }} className={cls}>{body}</Link>
  ) : (
    <Link to="/admin/projects" className={cls}>{body}</Link>
  );
}


function Dashboard() {
  const { me } = Route.useRouteContext();
  const { counts, bookings, quotes, messages } = Route.useLoaderData();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AdminPage title={`${greet}, ${me.name.split(" ")[0]}`} subtitle="Here's what's happening on your website.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="New bookings" value={counts.newBookings} tab="bookings" highlight />
        <Stat label="New quote requests" value={counts.newQuotes} tab="quotes" highlight />
        <Stat label="Unread messages" value={counts.unreadMessages} tab="messages" highlight />
        <Stat label="Published projects" value={counts.publishedProjects} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Latest bookings" actions={<Link to="/admin/inbox" search={{ tab: "bookings" }} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">View all</Link>}>
          {bookings.length === 0 ? (
            <p className="text-sm text-zinc-500">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.name}</p>
                    <p className="truncate text-xs text-zinc-500">{[b.service || "Consultation", b.preferred_date].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Badge status={String(b.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Latest quote requests" actions={<Link to="/admin/inbox" search={{ tab: "quotes" }} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">View all</Link>}>
          {quotes.length === 0 ? (
            <p className="text-sm text-zinc-500">No quote requests yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {quotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{q.name}</p>
                    <p className="truncate text-xs text-zinc-500">{[q.project_type, q.budget, fmtDate(q.created_at, false)].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Badge status={String(q.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Latest messages" actions={<Link to="/admin/inbox" search={{ tab: "messages" }} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">View all</Link>}>
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {messages.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.subject || m.name || m.email}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {m.source === "email" ? "Email" : "Website form"} · {fmtDate(m.created_at)}
                    </p>
                  </div>
                  <Badge status={m.is_read ? "read" : "unread"} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/admin/projects/$id" params={{ id: "new" }} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium hover:bg-zinc-50">
              + Add a project
            </Link>
            <Link to="/admin/settings" className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium hover:bg-zinc-50">
              Edit colours & layout
            </Link>
            <Link to="/admin/settings" search={{ tab: "contact" }} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium hover:bg-zinc-50">
              Update contact details
            </Link>
            <Link to="/admin/testimonials" className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium hover:bg-zinc-50">
              Add a testimonial
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            {counts.projects} projects · {counts.photos} photos · {counts.services} active services
          </p>
        </Card>
      </div>
    </AdminPage>
  );
}
