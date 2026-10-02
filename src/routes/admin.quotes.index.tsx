import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { listQuotes, type QuoteStatus } from "~/lib/quotes-api";
import { naira } from "~/lib/quote-calc";
import { cn } from "~/lib/ui";
import { AdminPage, Badge, EmptyState, fmtDate } from "~/components/admin/kit";

type Search = { status?: QuoteStatus };

export const Route = createFileRoute("/admin/quotes/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: ["draft", "sent", "accepted", "declined"].includes(String(s.status)) ? (s.status as QuoteStatus) : undefined,
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ deps }) => listQuotes({ data: { status: deps.status } }),
  component: QuotesList,
});

const STATUS_BADGE: Record<QuoteStatus, string> = { draft: "draft", sent: "confirmed", accepted: "won", declined: "cancelled" };

function QuotesList() {
  const quotes = Route.useLoaderData();
  const { status } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/quotes/" });

  const newBtn = (
    <Link to="/admin/quotes/$id" params={{ id: "new" }} className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
      + New quotation
    </Link>
  );

  return (
    <AdminPage title="Quotations" subtitle="Draft quotes, send them to clients, and track which are accepted." actions={newBtn}>
      <div className="mb-4 flex w-max gap-1 rounded-xl border border-zinc-200 bg-white p-1">
        {([undefined, "draft", "sent", "accepted", "declined"] as (QuoteStatus | undefined)[]).map((st) => (
          <button
            key={st ?? "all"}
            onClick={() => navigate({ search: { status: st } })}
            className={cn("rounded-lg px-3 py-1.5 text-sm font-medium capitalize", st === status ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
          >
            {st ?? "All"}
          </button>
        ))}
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          title={status ? `No ${status} quotations` : "No quotations yet"}
          text="Open a quote request in the Inbox and click 'Create quotation', or start a blank one."
          action={newBtn}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="hidden bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Valid until</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {quotes.map((q) => (
                <tr key={q.id} className="cursor-pointer hover:bg-zinc-50" onClick={() => navigate({ to: "/admin/quotes/$id", params: { id: String(q.id) } })}>
                  <td className="px-4 py-3 font-mono text-xs">{q.number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{q.client_name}</p>
                    <p className="text-xs text-zinc-500">{q.title || fmtDate(q.created_at, false)}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{naira(q.total)}</td>
                  <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">{q.valid_until || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge status={STATUS_BADGE[q.status] ?? q.status}>{q.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
