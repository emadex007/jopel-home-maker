import { useSite, waLink } from "~/lib/ui";
import { WhatsAppIcon } from "./Icons";

export function WhatsAppButton() {
  const s = useSite();
  if (!s.contact.showWhatsappButton || !s.contact.whatsapp) return null;
  return (
    <a
      href={waLink(s.contact.whatsapp, s.contact.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 md:bottom-7 md:right-7"
    >
      <WhatsAppIcon size={28} />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-40 group-hover:pr-1 md:inline">
        Chat with us
      </span>
    </a>
  );
}
