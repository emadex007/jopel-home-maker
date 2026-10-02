import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { deleteQuote, emailQuote, getQuote, newQuoteDraft, saveQuote, setQuoteStatus, type QuoteInput, type QuoteStatus } from "~/lib/quotes-api";
import { QUOTE_UNITS, lineTotal, naira, quoteTotals, type QuoteItem } from "~/lib/quote-calc";
import { cn, useSite, waLink } from "~/lib/ui";
import { AdminPage, Badge, Btn, Card, Modal, TextArea, TextInput, Toggle, useAction, useToast } from "~/components/admin/kit";
import { WhatsAppIcon } from "~/components/Icons";

type Search = { from?: number };

export const Route = createFileRoute("/admin/quotes/$id")({
  validateSearch: (s: Record<string, unknown>): Search => ({ from: Number(s.from) > 0 ? Number(s.from) : undefined }),
  loaderDeps: ({ search }) => ({ from: search.from }),
  loader: async ({ params, deps }) => {
    if (params.id === "new") {
      const d = await newQuoteDraft({ data: { fromRequestId: deps.from } });
      const { request, ...draft } = d;
      return { quote: null, draft: draft as QuoteInput, request };
    }
    const res = await getQuote({ data: Number(params.id) });
    if (!res) throw notFound();
    return { quote: res.quote, draft: null, request: res.request };
  },
  component: QuoteEditor,
});

const blankItem = (): QuoteItem => ({ description: "", qty: 1, unit: "item", rate: 0 });
const cellCls = "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900";

function QuoteEditor() {
  const s = useSite();
  const { quote, draft, request } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const toast = useToast();
  const { busy, run } = useAction();

  const initial = (): QuoteInput =>
    quote
      ? {
          id: quote.id,
          quote_request_id: quote.quote_request_id,
          client_name: quote.client_name,
          client_email: quote.client_email,
          client_phone: quote.client_phone,
          client_address: quote.client_address,
          title: quote.title,
          items: quote.items.length ? quote.items : [blankItem()],
          discount: quote.discount,
          tax_rate: quote.tax_rate,
          notes: quote.notes,
          valid_until: quote.valid_until,
        }
      : (draft as QuoteInput);

  const [f, setF] = useState<QuoteInput>(initial);
  const [dirty, setDirty] = useState(!quote);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  useEffect(() => {
    setF(initial());
    setDirty(!quote);
  }, [quote?.id, quote?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof QuoteInput>(k: K, v: QuoteInput[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const setItem = (i: number, patch: Partial<QuoteItem>) => set("items", f.items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const moveItem = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= f.items.length) return;
    const n = [...f.items];
    [n[i], n[j]] = [n[j], n[i]];
    set("items", n);
  };

  const totals = useMemo(() => quoteTotals(f.items, f.discount, f.tax_rate), [f.items, f.discount, f.tax_rate]);
  const link = quote && typeof window !== "undefined" ? `${window.location.origin}/q/${quote.public_token}` : "";

  async function save(): Promise<boolean> {
    const res = await run(() => saveQuote({ data: f }), quote ? "Quotation saved" : "Quotation created");
    if (!res || !res.ok) return false;
    setDirty(false);
    if (!quote) navigate({ to: "/admin/quotes/$id", params: { id: String(res.id) }, search: {} });
    else await router.invalidate();
    return true;
  }

  async function status(st: QuoteStatus, msg?: string) {
    if (!quote) return;
    await run(() => setQuoteStatus({ data: { id: quote.id, status: st } }), msg ?? `Marked as ${st}`);
    router.invalidate();
  }

  async function sendWhatsApp() {
    if (!quote) return;
    if (dirty && !(await save())) return;
    const first = f.client_name.split(" ")[0];
    const msg = `Hello ${first}, this is ${s.brand.name}. Here is your quotation ${quote.number}${f.title ? ` for ${f.title}` : ""} (total ${naira(totals.total)}):\n${link}\n\nYou can view, print or accept it from the link. Let us know if you have any questions.`;
    window.open(waLink(f.client_phone, msg), "_blank", "noopener");
    if (quote.status === "draft") status("sent", "Marked as sent");
  }

  async function sendEmail() {
    if (!quote) return;
    if (dirty && !(await save())) return;
    const r = await run(() => emailQuote({ data: { id: quote.id, origin: window.location.origin, message: emailMsg } }), `Quotation emailed to ${f.client_email}`);
    if (r) {
      setEmailOpen(false);
      router.invalidate();
    }
  }

  const statusBadge: Record<QuoteStatus, string> = { draft: "draft", sent: "confirmed", accepted: "won", declined: "cancelled" };

  return (
    <AdminPage
      title={quote ? `Quotation ${quote.number}` : "New quotation"}
      subtitle={quote ? f.client_name : request ? `From quote request ${request.ref}` : "Fill in the client and items, then save."}
      actions={
        <>
          <Link to="/admin/quotes" className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100">
            ← All quotations
          </Link>
          <Btn variant="primary" onClick={save} disabled={busy || (!!quote && !dirty)}>
            {busy ? "Saving…" : quote ? (dirty ? "Save changes" : "Saved") : "Create quotation"}
          </Btn>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Client">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Client name *" value={f.client_name} onChange={(v) => set("client_name", v)} />
              <TextInput label="Phone / WhatsApp" value={f.client_phone} onChange={(v) => set("client_phone", v)} />
              <TextInput label="Email" type="email" value={f.client_email} onChange={(v) => set("client_email", v)} />
              <TextInput label="Address / location" value={f.client_address} onChange={(v) => set("client_address", v)} />
              <TextInput className="sm:col-span-2" label="Project title" hint="e.g. Living room & master bedroom redesign" value={f.title} onChange={(v) => set("title", v)} />
            </div>
          </Card>

          <Card title="Items" description="Rates are in Naira. Line totals and the grand total update as you type.">
            <div className="-mx-2 overflow-x-auto px-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr>
                    <th className="w-6 pb-2" />
                    <th className="pb-2 font-medium">Description</th>
                    <th className="w-20 pb-2 font-medium">Qty</th>
                    <th className="w-24 pb-2 font-medium">Unit</th>
                    <th className="w-32 pb-2 font-medium">Rate (₦)</th>
                    <th className="w-32 pb-2 text-right font-medium">Amount</th>
                    <th className="w-8 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {f.items.map((it, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-1 pr-1">
                        <div className="flex flex-col text-[0.6rem] leading-none text-zinc-400">
                          <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="px-1 py-0.5 hover:text-zinc-900 disabled:opacity-30" aria-label="Move up">▲</button>
                          <button onClick={() => moveItem(i, 1)} disabled={i === f.items.length - 1} className="px-1 py-0.5 hover:text-zinc-900 disabled:opacity-30" aria-label="Move down">▼</button>
                        </div>
                      </td>
                      <td className="py-1 pr-2">
                        <textarea rows={1} value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} className={cn(cellCls, "min-h-[34px] resize-y")} placeholder="e.g. Supply & install 3-seater sofa" />
                      </td>
                      <td className="py-1 pr-2">
                        <input type="number" min={0} step="any" value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} className={cellCls} />
                      </td>
                      <td className="py-1 pr-2">
                        <input list="quote-units" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} className={cellCls} />
                      </td>
                      <td className="py-1 pr-2">
                        <input type="number" min={0} step="any" value={it.rate} onChange={(e) => setItem(i, { rate: Number(e.target.value) })} className={cellCls} />
                      </td>
                      <td className="py-1 pl-2 pt-2.5 text-right font-medium tabular-nums">{naira(lineTotal(it))}</td>
                      <td className="py-1 pl-1">
                        <button onClick={() => set("items", f.items.length > 1 ? f.items.filter((_, j) => j !== i) : [blankItem()])} className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label="Remove item">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="quote-units">
                {QUOTE_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <Btn size="sm" className="mt-3" onClick={() => set("items", [...f.items, blankItem()])}>+ Add item</Btn>

            <div className="mt-6 grid gap-6 border-t border-zinc-100 pt-5 sm:grid-cols-2">
              <div className="space-y-4">
                <TextInput label="Discount (₦)" type="number" min={0} value={String(f.discount ?? 0)} onChange={(v) => set("discount", Number(v))} />
                <Toggle label="Add VAT" hint="Off by default. Turn on for this quote only." checked={f.tax_rate > 0} onChange={(v) => set("tax_rate", v ? 7.5 : 0)} />
                {f.tax_rate > 0 && <TextInput label="VAT rate (%)" type="number" min={0} max={100} step="0.5" value={String(f.tax_rate)} onChange={(v) => set("tax_rate", Number(v))} />}
              </div>
              <dl className="space-y-2 self-end rounded-lg bg-zinc-50 p-4 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd className="tabular-nums">{naira(totals.subtotal)}</dd></div>
                {totals.discount > 0 && <div className="flex justify-between"><dt className="text-zinc-500">Discount</dt><dd className="tabular-nums">−{naira(totals.discount)}</dd></div>}
                {f.tax_rate > 0 && <div className="flex justify-between"><dt className="text-zinc-500">VAT ({f.tax_rate}%)</dt><dd className="tabular-nums">{naira(totals.tax)}</dd></div>}
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{naira(totals.total)}</dd></div>
              </dl>
            </div>
          </Card>

          <Card title="Notes for the client">
            <TextArea label="Notes" hint="Shown on the quotation, e.g. what's included, timelines, materials." rows={4} value={f.notes} onChange={(v) => set("notes", v)} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <div className="flex items-center justify-between gap-3">
              <Badge status={quote ? statusBadge[quote.status] : "draft"}>{quote?.status ?? "not saved"}</Badge>
              {quote && (
                <select value={quote.status} onChange={(e) => status(e.target.value as QuoteStatus)} className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm capitalize">
                  {(["draft", "sent", "accepted", "declined"] as QuoteStatus[]).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-4">
              <TextInput label="Valid until" type="date" value={f.valid_until} onChange={(v) => set("valid_until", v)} hint={`New quotes default to ${s.quotes.validDays} days (change in Site settings → Quotations).`} />
            </div>
          </Card>

          <Card title="Send to client">
            {!quote ? (
              <p className="text-sm text-zinc-500">Create the quotation first, then you can send it.</p>
            ) : (
              <div className="space-y-2">
                <a href={`/q/${quote.public_token}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
                  Preview / print ↗
                </a>
                <Btn
                  className="w-full"
                  onClick={async () => {
                    await navigator.clipboard.writeText(link);
                    toast("Link copied");
                  }}
                >
                  Copy client link
                </Btn>
                <button
                  onClick={sendWhatsApp}
                  disabled={!f.client_phone}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <WhatsAppIcon size={16} /> Send on WhatsApp
                </button>
                <Btn className="w-full" disabled={!f.client_email} onClick={() => setEmailOpen(true)}>
                  Send by email
                </Btn>
                {(!f.client_phone || !f.client_email) && <p className="text-xs text-zinc-500">Add the client's phone or email to send it.</p>}
              </div>
            )}
          </Card>

          {request && (
            <Card title="Original request" description={String(request.ref)}>
              <dl className="space-y-2 text-sm">
                {[
                  ["Project", request.project_type],
                  ["Spaces", request.spaces],
                  ["Size", request.size],
                  ["Budget", request.budget],
                  ["Style", request.style],
                  ["Timeline", request.timeline],
                  ["Details", request.details],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={String(k)}>
                      <dt className="text-xs text-zinc-500">{k}</dt>
                      <dd className="whitespace-pre-wrap">{String(v)}</dd>
                    </div>
                  ))}
              </dl>
            </Card>
          )}

          {quote && (
            <Card title="Danger zone">
              <Btn
                variant="danger"
                onClick={async () => {
                  if (!confirm(`Delete quotation ${quote.number}? The client link will stop working.`)) return;
                  const r = await run(() => deleteQuote({ data: quote.id }), "Quotation deleted");
                  if (r) navigate({ to: "/admin/quotes" });
                }}
              >
                Delete quotation
              </Btn>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={emailOpen}
        title={`Email quotation to ${f.client_email}`}
        onClose={() => setEmailOpen(false)}
        footer={
          <>
            <Btn onClick={() => setEmailOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={sendEmail} disabled={busy}>{busy ? "Sending…" : "Send email"}</Btn>
          </>
        }
      >
        <TextArea label="Personal message (optional)" hint="Leave empty for a standard message. The email includes the total and a button to view the quotation." rows={5} value={emailMsg} onChange={setEmailMsg} />
      </Modal>
    </AdminPage>
  );
}
