import { phoneDigits, useSite, waLink } from "~/lib/ui";
import { SiteLink } from "./SiteLink";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
import { SocialLinks } from "./SocialLinks";
import type { Service } from "~/server/db";

export function Footer({ services }: { services?: Pick<Service, "slug" | "title">[] }) {
  const s = useSite();
  const c = s.contact;
  const year = new Date().getFullYear();
  const copyright = s.footer.copyright.replace("{year}", String(year)).replace("{name}", s.brand.name);

  return (
    <footer style={{ background: "var(--footer-bg)", color: "var(--footer-fg)" }}>
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <p className="font-heading text-3xl">{s.brand.name}</p>
          {s.brand.tagline && <p className="mt-1 text-sm italic opacity-70">{s.brand.tagline}</p>}
          <p className="mt-5 max-w-sm text-sm leading-relaxed opacity-75">{s.footer.about}</p>
          {s.footer.showSocial && <SocialLinks size={20} className="mt-6 gap-5" />}
        </div>

        <div className="lg:col-span-2">
          <p className="eyebrow mb-5">Explore</p>
          <ul className="space-y-3 text-sm">
            {s.header.nav.map((n) => (
              <li key={n.to + n.label}>
                <SiteLink to={n.to} className="opacity-75 transition-opacity hover:opacity-100">
                  {n.label}
                </SiteLink>
              </li>
            ))}
            <li>
              <SiteLink to="/book" className="opacity-75 transition-opacity hover:opacity-100">Book a Consultation</SiteLink>
            </li>
            <li>
              <SiteLink to="/quote" className="opacity-75 transition-opacity hover:opacity-100">Request a Quote</SiteLink>
            </li>
          </ul>
        </div>

        {s.footer.showServices && services && services.length > 0 && (
          <div className="lg:col-span-3">
            <p className="eyebrow mb-5">Services</p>
            <ul className="space-y-3 text-sm">
              {services.slice(0, 7).map((sv) => (
                <li key={sv.slug}>
                  <SiteLink to={`/services#${sv.slug}`} className="opacity-75 transition-opacity hover:opacity-100">
                    {sv.title}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.footer.showContact && (
          <div className="lg:col-span-3">
            <p className="eyebrow mb-5">Contact</p>
            <ul className="space-y-4 text-sm">
              {c.address && (
                <li className="flex gap-3 opacity-80"><PinIcon size={18} className="mt-0.5 shrink-0" /> <span className="whitespace-pre-line">{c.address}</span></li>
              )}
              {c.phone && (
                <li>
                  <a href={`tel:+${phoneDigits(c.phone)}`} className="flex gap-3 opacity-80 hover:opacity-100"><PhoneIcon size={18} className="shrink-0" /> {c.phone}</a>
                </li>
              )}
              {c.whatsapp && (
                <li>
                  <a href={waLink(c.whatsapp, c.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex gap-3 opacity-80 hover:opacity-100"><WhatsAppIcon size={18} className="shrink-0" /> WhatsApp us</a>
                </li>
              )}
              {c.email && (
                <li>
                  <a href={`mailto:${c.email}`} className="flex gap-3 break-all opacity-80 hover:opacity-100"><MailIcon size={18} className="shrink-0" /> {c.email}</a>
                </li>
              )}
              {c.hours && (
                <li className="flex gap-3 opacity-80"><ClockIcon size={18} className="shrink-0" /> {c.hours}</li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs opacity-60 md:flex-row md:items-center md:justify-between">
          <p>{copyright}</p>
          <p>
            Website by{" "}
            <a href="https://emadexcreations.com.ng" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              Emadex Creations
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
