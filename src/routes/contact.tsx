import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { submitContact, type ContactInput } from "~/lib/api";
import { useSite } from "~/lib/ui";
import { FormError, FormSuccess, Honeypot, PageHero } from "~/components/ui";
import { ContactPanel } from "~/components/ContactPanel";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us | Jo-pearl Home Maker" }] }),
  component: Contact,
});

function Contact() {
  const s = useSite();
  const [f, setF] = useState<ContactInput>({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = <K extends keyof ContactInput>(k: K, v: ContactInput[K]) => setF((x) => ({ ...x, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await submitContact({ data: f });
      if (res.ok) setDone(true);
      else setError(res.error);
    } catch {
      setError("Something went wrong. Please try again, or reach us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero eyebrow="Get in touch" title={s.pages.contactTitle} intro={s.pages.contactIntro} image={s.pages.formsImage} />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:order-2">
            <ContactPanel title="Contact details" />
          </div>
          <div className="lg:col-span-8">
            {done ? (
              <FormSuccess title="Message sent" text={`Thank you, ${f.name.split(" ")[0]}. We've received your message and will get back to you soon.`} />
            ) : (
              <form onSubmit={onSubmit} className="relative space-y-5 rounded-[var(--radius)] border border-line bg-surface p-6 md:p-10" noValidate>
                <Honeypot value={f.website ?? ""} onChange={(v) => set("website", v)} />
                <h2 className="text-3xl">Send us a message</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="field sm:col-span-2">
                    <label htmlFor="c-name">Full name *</label>
                    <input id="c-name" required autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="c-phone">Phone</label>
                    <input id="c-phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div className="field sm:col-span-2">
                    <label htmlFor="c-subject">Subject</label>
                    <input id="c-subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} />
                  </div>
                  <div className="field sm:col-span-2">
                    <label htmlFor="c-message">Message *</label>
                    <textarea id="c-message" required value={f.message} onChange={(e) => set("message", e.target.value)} />
                  </div>
                </div>
                <FormError message={error} />
                <div className="flex justify-end">
                  <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Sending…" : "Send Message"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
        {s.contact.mapEmbedUrl.startsWith("https://www.google.com/maps/embed") && (
          <div className="container-x mt-12">
            <iframe
              title="Our location"
              src={s.contact.mapEmbedUrl}
              className="h-[380px] w-full rounded-[var(--radius)] border-0 bg-line"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </section>
    </>
  );
}
