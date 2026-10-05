import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getServices, submitQuoteRequest, type QuoteInput } from "~/lib/api";
import { cn, useSite } from "~/lib/ui";
import { FormError, FormSuccess, Honeypot, PageHero } from "~/components/ui";
import { ContactPanel } from "~/components/ContactPanel";
import { CloseIcon, UploadIcon } from "~/components/Icons";
import { pageTitle } from "~/lib/brand";

type Search = { service?: string };

export const Route = createFileRoute("/quote")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    service: typeof s.service === "string" ? s.service.slice(0, 120) : undefined,
  }),
  loader: () => getServices(),
  head: () => ({ meta: [{ title: pageTitle("Request a Quote") }] }),
  component: Quote,
});

const PROJECT_TYPES = ["Residential (house)", "Apartment / estate", "Office", "Commercial / retail", "Hospitality / short-let", "Other"];
const SPACES = ["Living room", "Bedroom", "Kitchen", "Dining", "Bathroom", "Children's room", "Office / Study", "Reception", "Exterior / facade", "Whole building"];
const STYLES = ["Modern", "Contemporary", "Classic / Luxury", "Minimalist", "African / Afro-modern", "Not sure, help me decide"];
const BUDGETS = ["Under ₦1M", "₦1M to ₦3M", "₦3M to ₦7M", "₦7M to ₦15M", "Above ₦15M", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Within 1 month", "1 to 3 months", "3+ months", "Just planning"];
const MAX_PHOTOS = 6;

type Upload = { name: string; url?: string; preview: string; error?: string };

function Chips({ options, value, onToggle, multi = false }: { options: string[]; value: string[]; onToggle: (v: string) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            data-on={on}
            onClick={() => onToggle(o)}
            className="chip"
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Quote() {
  const s = useSite();
  const services = Route.useLoaderData();
  const { service } = Route.useSearch();
  const [f, setF] = useState<QuoteInput>({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    services: service ? [service] : [],
    spaces: [],
    size: "",
    budget: "",
    style: "",
    location: "",
    timeline: "",
    details: "",
    attachments: [],
    website: "",
  });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof QuoteInput>(k: K, v: QuoteInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const uploading = uploads.some((u) => !u.url && !u.error);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - uploads.length;
    for (const file of Array.from(files).slice(0, room)) {
      const preview = URL.createObjectURL(file);
      setUploads((u) => [...u, { name: file.name, preview }]);
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = (await res.json()) as { url?: string; error?: string };
        setUploads((u) => u.map((x) => (x.preview === preview ? { ...x, url: data.url, error: data.url ? undefined : data.error || "Upload failed" } : x)));
      } catch {
        setUploads((u) => u.map((x) => (x.preview === preview ? { ...x, error: "Upload failed" } : x)));
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.projectType) return setError("Please choose the type of project.");
    setBusy(true);
    try {
      const attachments = uploads.map((u) => u.url).filter((u): u is string => !!u);
      const res = await submitQuoteRequest({ data: { ...f, attachments } });
      if (res.ok) {
        setDone(res.ref);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setError(res.error);
    } catch {
      setError("Something went wrong. Please try again, or reach us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero eyebrow="Free quotation" title={s.pages.quoteTitle} intro={s.pages.quoteIntro} image={s.pages.formsImage} />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {done ? (
              <FormSuccess
                title="Quote request received"
                text={`Thank you, ${f.name.split(" ")[0]}. Our team will review your project and send you a quotation. We may call you if we need more details.`}
                refCode={done}
              >
                <Link to="/portfolio" className="btn btn-primary">Browse our portfolio</Link>
                <Link to="/book" className="btn btn-outline">Book a site visit</Link>
              </FormSuccess>
            ) : (
              <form onSubmit={onSubmit} className="relative space-y-10 rounded-[var(--radius)] border border-line bg-surface p-6 md:p-10" noValidate>
                <Honeypot value={f.website ?? ""} onChange={(v) => set("website", v)} />

                <fieldset className="space-y-5">
                  <legend className="mb-5 text-3xl font-heading">1. About the project</legend>
                  <div>
                    <p className="mb-3 text-sm font-semibold">Type of project *</p>
                    <Chips options={PROJECT_TYPES} value={[f.projectType]} onToggle={(v) => set("projectType", v)} />
                  </div>
                  {services.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-semibold">Services you need <span className="font-normal text-muted">(choose all that apply)</span></p>
                      <Chips
                        multi
                        options={services.map((sv) => sv.title)}
                        value={f.services ?? []}
                        onToggle={(v) => {
                          const cur = f.services ?? [];
                          set("services", cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <p className="mb-3 text-sm font-semibold">Which spaces? <span className="font-normal text-muted">(choose all that apply)</span></p>
                    <Chips
                      multi
                      options={SPACES}
                      value={f.spaces}
                      onToggle={(v) => set("spaces", f.spaces.includes(v) ? f.spaces.filter((x) => x !== v) : [...f.spaces, v])}
                    />
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold">Preferred style</p>
                    <Chips options={STYLES} value={[f.style]} onToggle={(v) => set("style", f.style === v ? "" : v)} />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="field">
                      <label htmlFor="q-size">Approximate size</label>
                      <input id="q-size" value={f.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 3-bedroom flat, or 120 sqm" />
                    </div>
                    <div className="field">
                      <label htmlFor="q-location">Project location</label>
                      <input id="q-location" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Area, city" />
                    </div>
                    <div className="field">
                      <label htmlFor="q-budget">Budget range</label>
                      <select id="q-budget" value={f.budget} onChange={(e) => set("budget", e.target.value)}>
                        <option value="">Select…</option>
                        {BUDGETS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="q-timeline">When do you want to start?</label>
                      <select id="q-timeline" value={f.timeline} onChange={(e) => set("timeline", e.target.value)}>
                        <option value="">Select…</option>
                        {TIMELINES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="q-details">Describe what you want</label>
                    <textarea
                      id="q-details"
                      value={f.details}
                      onChange={(e) => set("details", e.target.value)}
                      placeholder="What would you like done? Colours you love, furniture to keep, anything we should know…"
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold">Photos of the space <span className="font-normal text-muted">(optional, up to {MAX_PHOTOS})</span></p>
                    <p className="mb-3 text-xs text-muted">Current photos or inspiration images help us quote more accurately.</p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {uploads.map((u) => (
                        <div key={u.preview} className="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-line">
                          <img src={u.preview} alt={u.name} className={cn("h-full w-full object-cover", !u.url && "opacity-50")} />
                          {!u.url && !u.error && <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-semibold">Uploading…</span>}
                          {u.error && <span className="absolute inset-x-0 bottom-0 bg-red-600 px-1 py-0.5 text-[0.6rem] text-white">{u.error}</span>}
                          <button
                            type="button"
                            aria-label={`Remove ${u.name}`}
                            onClick={() => setUploads((x) => x.filter((y) => y.preview !== u.preview))}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                          >
                            <CloseIcon size={12} />
                          </button>
                        </div>
                      ))}
                      {uploads.length < MAX_PHOTOS && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius)] border border-dashed border-line text-xs text-muted transition-colors hover:border-accent hover:text-ink"
                        >
                          <UploadIcon size={20} /> Add photos
                        </button>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                  </div>
                </fieldset>

                <fieldset className="space-y-5">
                  <legend className="mb-5 text-3xl font-heading">2. Your details</legend>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="field sm:col-span-2">
                      <label htmlFor="q-name">Full name *</label>
                      <input id="q-name" required autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="q-phone">Phone / WhatsApp *</label>
                      <input id="q-phone" required type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="q-email">Email <span className="font-normal text-muted">(to receive your quotation)</span></label>
                      <input id="q-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
                    </div>
                  </div>
                </fieldset>

                <FormError message={error} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">No payment needed. This is a free, no-obligation quote.</p>
                  <button type="submit" disabled={busy || uploading} className="btn btn-primary">
                    {uploading ? "Uploading photos…" : busy ? "Sending…" : "Request My Quote"}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <ContactPanel title="Quick question first?" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
