import { useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { acceptPublicQuote, getPublicQuote } from "~/lib/quotes-api";
import { lineTotal, naira, quoteTotals } from "~/lib/quote-calc";
import { img, phoneDigits, useSite, waLink } from "~/lib/ui";
import { CheckIcon, WhatsAppIcon } from "~/components/Icons";

export const Route = createFileRoute("/q/$token")({
  loader: async ({ params }) => {
    const q = await getPublicQuote({ data: params.token });
    if (!q) throw notFound();
    return q;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `Quotation ${loaderData.number}` : "Quotation" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: PublicQuote,
});

const fmt = (d: string) => {
  if (!d) return "";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + "T00:00" : d.replace(" ", "T") + "Z");
  return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
};

function PublicQuote() {
  const s = useSite();
  const q = Route.useLoaderData();
  const [status, setStatus] = useState(q.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = quoteTotals(q.items, q.discount, q.tax_rate);
  const expired = !!q.valid_until && q.valid_until < new Date().toISOString().slice(0, 10) && status !== "accepted";
  const c = s.contact;

  async function accept() {
    if (!confirm(`Accept quotation ${q.number} for ${naira(t.total)}?`)) return;
    setBusy(true);
    setError("");
    try {
      const r = await acceptPublicQuote({ data: q.token });
      if (r.ok) setStatus("accepted");
      else setError(r.error);
    } catch {
      setError("Something went wrong. Please try again or contact us.");
    } finally {
      setBusy(false);
    }
  }

  const askMsg = `Hello ${s.brand.name}, I have a question about quotation ${q.number}.`;

  return (
    <div className="min-h-screen bg-zinc-100 py-6 print:bg-white print:py-0 md:py-12">
      {/* Actions (hidden when printing) */}
      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 print:hidden">
        <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">← {s.brand.name}</a>
        <button onClick={() => window.print()} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Print / Save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl bg-white p-6 shadow-sm print:max-w-none print:p-0 print:shadow-none sm:p-10 md:p-12">
        {/* Letterhead */}
        <header className="flex flex-col gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {s.brand.logoUrl ? (
              <img src={img(s.brand.logoUrl, 400)} alt={s.brand.name} className="h-14 w-auto object-contain" />
            ) : (
              <p className="font-heading text-3xl text-ink">{s.brand.name}</p>
            )}
            {s.brand.tagline && <p className="mt-1 text-sm italic text-muted">{s.brand.tagline}</p>}
          </div>
          <div className="text-sm text-zinc-600 sm:text-right">
            {c.address && <p className="whitespace-pre-line">{c.address}</p>}
            {c.phone && <p>{c.phone}</p>}
            {[c.email, c.email2].filter(Boolean).map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        </header>

        <div className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Quotation</p>
            <p className="mt-1 font-heading text-4xl text-ink">{q.number}</p>
            {q.title && <p className="mt-2 text-zinc-700">{q.title}</p>}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:justify-self-end">
            <dt className="text-zinc-500">Date</dt>
            <dd>{fmt(q.created_at)}</dd>
            {q.valid_until && (
              <>
                <dt className="text-zinc-500">Valid until</dt>
                <dd className={expired ? "font-semibold text-red-600" : ""}>{fmt(q.valid_until)}{expired && " (expired)"}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="mb-8 rounded-lg bg-zinc-50 p-4 text-sm print:border print:border-zinc-200 print:bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Prepared for</p>
          <p className="mt-1 font-semibold">{q.client_name}</p>
          {[q.client_address, q.client_phone, q.client_email].filter(Boolean).map((x) => (
            <p key={x} className="text-zinc-600">{x}</p>
          ))}
        </div>

        {s.quotes.intro && <p className="mb-6 text-sm leading-relaxed text-zinc-700">{s.quotes.intro}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-left text-xs uppercase tracking-wide">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-2 font-semibold">Description</th>
                <th className="py-2 pr-2 text-right font-semibold">Qty</th>
                <th className="py-2 pr-2 text-right font-semibold">Rate</th>
                <th className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={i} className="border-b border-zinc-100 align-top">
                  <td className="py-3 pr-2 text-zinc-400">{i + 1}</td>
                  <td className="whitespace-pre-wrap py-3 pr-2">{it.description}</td>
                  <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums">
                    {it.qty} {it.unit}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums">{naira(it.rate)}</td>
                  <td className="whitespace-nowrap py-3 text-right font-medium tabular-nums">{naira(lineTotal(it))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd className="tabular-nums">{naira(t.subtotal)}</dd></div>
          {t.discount > 0 && <div className="flex justify-between"><dt className="text-zinc-500">Discount</dt><dd className="tabular-nums">−{naira(t.discount)}</dd></div>}
          {q.tax_rate > 0 && <div className="flex justify-between"><dt className="text-zinc-500">VAT ({q.tax_rate}%)</dt><dd className="tabular-nums">{naira(t.tax)}</dd></div>}
          <div className="flex justify-between border-t-2 border-zinc-900 pt-2 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{naira(t.total)}</dd></div>
        </dl>

        {q.notes && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{q.notes}</p>
          </section>
        )}
        {s.quotes.terms && (
          <section className="mt-8 border-t border-zinc-200 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Terms</h2>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">{s.quotes.terms}</p>
          </section>
        )}

        {/* Client actions */}
        <section className="mt-10 rounded-xl border border-zinc-200 p-6 print:hidden">
          {status === "accepted" ? (
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><CheckIcon size={20} /></span>
              <div>
                <p className="font-semibold">Quotation accepted</p>
                <p className="mt-1 text-sm text-zinc-600">{s.quotes.acceptMessage}</p>
              </div>
            </div>
          ) : status === "declined" ? (
            <p className="text-sm text-zinc-600">This quotation is no longer active. Please contact us for an updated one.</p>
          ) : (
            <>
              <p className="font-semibold">{expired ? "This quotation has expired" : "Happy with this quotation?"}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {expired ? "Contact us and we'll send you an updated quotation." : "Accept it below and our team will contact you to agree the next steps. Questions first? Message us."}
              </p>
              {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                {!expired && (
                  <button onClick={accept} disabled={busy} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60">
                    {busy ? "Please wait…" : "Accept quotation"}
                  </button>
                )}
                {c.whatsapp && (
                  <a href={waLink(c.whatsapp, askMsg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white">
                    <WhatsAppIcon size={16} /> Ask a question
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:+${phoneDigits(c.phone)}`} className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-50">
                    Call {c.phone}
                  </a>
                )}
              </div>
            </>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-zinc-400">
          {s.brand.name} · {s.brand.tagline}
        </footer>
      </article>
    </div>
  );
}
