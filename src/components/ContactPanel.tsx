import type { ReactNode } from "react";
import { phoneDigits, useSite, waLink } from "~/lib/ui";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./Icons";
import { SocialLinks } from "./SocialLinks";

/** Contact details panel shown beside the booking, quote and contact forms. */
export function ContactPanel({ title = "Prefer to talk?", children }: { title?: string; children?: ReactNode }) {
  const s = useSite();
  const c = s.contact;
  return (
    <aside className="rounded-[var(--radius)] bg-primary p-8 text-on-primary md:p-10">
      <h2 className="text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed opacity-75">Reach us directly and we'll be happy to help.</p>
      {children}
      <ul className="mt-8 space-y-5 text-sm">
        {c.whatsapp && (
          <li>
            <a href={waLink(c.whatsapp, c.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              <WhatsAppIcon /> Chat on WhatsApp
            </a>
          </li>
        )}
        {c.phone && (
          <li>
            <a href={`tel:+${phoneDigits(c.phone)}`} className="flex items-center gap-3 hover:opacity-80"><PhoneIcon size={18} /> {c.phone}</a>
          </li>
        )}
        {c.email && (
          <li>
            <a href={`mailto:${c.email}`} className="flex items-center gap-3 break-all hover:opacity-80"><MailIcon size={18} className="shrink-0" /> {c.email}</a>
          </li>
        )}
        {c.address && (
          <li className="flex gap-3"><PinIcon size={18} className="mt-0.5 shrink-0" /> <span className="whitespace-pre-line opacity-90">{c.address}</span></li>
        )}
        {c.hours && (
          <li className="flex items-center gap-3"><ClockIcon size={18} /> <span className="opacity-90">{c.hours}</span></li>
        )}
      </ul>
      <SocialLinks size={20} className="mt-8 gap-5 opacity-90" />
    </aside>
  );
}
