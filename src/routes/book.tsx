import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getServices, submitBooking, type BookingInput } from "~/lib/api";
import { useSite } from "~/lib/ui";
import { FormError, FormSuccess, Honeypot, PageHero } from "~/components/ui";
import { ContactPanel } from "~/components/ContactPanel";
import { pageTitle } from "~/lib/brand";

type Search = { service?: string };

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    service: typeof s.service === "string" ? s.service.slice(0, 120) : undefined,
  }),
  loader: () => getServices(),
  head: () => ({ meta: [{ title: pageTitle("Book a Consultation") }] }),
  component: Book,
});

const TIMES = ["Morning (9am to 12pm)", "Afternoon (12pm to 3pm)", "Evening (3pm to 6pm)"];
const VISIT_TYPES = ["Site visit", "Office visit", "Phone / video call"];

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function Book() {
  const s = useSite();
  const services = Route.useLoaderData();
  const { service } = Route.useSearch();
  const [f, setF] = useState<BookingInput>({
    name: "",
    email: "",
    phone: "",
    service: service ?? "",
    visitType: VISIT_TYPES[0],
    date: "",
    time: TIMES[0],
    address: "",
    notes: "",
    website: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof BookingInput>(k: K, v: BookingInput[K]) => setF((x) => ({ ...x, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await submitBooking({ data: f });
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
      <PageHero eyebrow="Consultation" title={s.pages.bookTitle} intro={s.pages.bookIntro} image={s.pages.formsImage} />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {done ? (
              <FormSuccess
                title="Booking received"
                text={`Thank you, ${f.name.split(" ")[0]}. We'll contact you shortly to confirm your ${f.visitType.toLowerCase()} on ${new Date(f.date + "T00:00").toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}.`}
                refCode={done}
              >
                <Link to="/portfolio" className="btn btn-primary">Browse our portfolio</Link>
                <Link to="/" className="btn btn-outline">Back to home</Link>
              </FormSuccess>
            ) : (
              <form onSubmit={onSubmit} className="relative space-y-6 rounded-[var(--radius)] border border-line bg-surface p-6 md:p-10" noValidate>
                <Honeypot value={f.website ?? ""} onChange={(v) => set("website", v)} />
                <div>
                  <h2 className="text-3xl">Your details</h2>
                  <p className="mt-1 text-sm text-muted">Fields marked * are required.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="field sm:col-span-2">
                    <label htmlFor="b-name">Full name *</label>
                    <input id="b-name" required autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="b-phone">Phone / WhatsApp *</label>
                    <input id="b-phone" required type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="b-email">Email</label>
                    <input id="b-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                </div>

                <hr className="border-line" />
                <h2 className="text-3xl">Appointment</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="field">
                    <label htmlFor="b-service">Service</label>
                    <select id="b-service" value={f.service} onChange={(e) => set("service", e.target.value)}>
                      <option value="">Not sure yet</option>
                      {services.map((sv) => (
                        <option key={sv.id} value={sv.title}>{sv.title}</option>
                      ))}
                      {f.service && !services.some((sv) => sv.title === f.service) && <option value={f.service}>{f.service}</option>}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="b-type">Type of appointment</label>
                    <select id="b-type" value={f.visitType} onChange={(e) => set("visitType", e.target.value)}>
                      {VISIT_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="b-date">Preferred date *</label>
                    <input id="b-date" required type="date" min={today()} value={f.date} onChange={(e) => set("date", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="b-time">Preferred time</label>
                    <select id="b-time" value={f.time} onChange={(e) => set("time", e.target.value)}>
                      {TIMES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {f.visitType === "Site visit" && (
                    <div className="field sm:col-span-2">
                      <label htmlFor="b-address">Site address</label>
                      <input id="b-address" autoComplete="street-address" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Where should we visit?" />
                    </div>
                  )}
                  <div className="field sm:col-span-2">
                    <label htmlFor="b-notes">Tell us a little about the project</label>
                    <textarea id="b-notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Rooms, style you like, budget range, anything we should know…" />
                  </div>
                </div>
                <FormError message={error} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">We'll confirm your appointment by phone, WhatsApp or email.</p>
                  <button type="submit" disabled={busy} className="btn btn-primary">
                    {busy ? "Sending…" : "Request Booking"}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="lg:col-span-4">
            <ContactPanel />
          </div>
        </div>
      </section>
    </>
  );
}
