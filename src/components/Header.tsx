import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn, img, phoneDigits, useSite, waLink } from "~/lib/ui";
import { SiteLink } from "./SiteLink";
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "./Icons";
import { SocialLinks } from "./SocialLinks";

export function Header() {
  const s = useSite();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const isHome = pathname === "/";
  const overlay = isHome && s.header.transparentOnHome;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const solid = !overlay || scrolled || open;
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"));

  return (
    <>
      {s.topBar.show && (
        <div style={{ background: "var(--topbar-bg)", color: "var(--topbar-fg)" }} className="text-xs">
          <div className="container-x flex items-center justify-between gap-4 py-2">
            <p className="truncate">{s.topBar.text}</p>
            <div className="hidden items-center gap-5 md:flex">
              {s.contact.phone && (
                <a href={`tel:+${phoneDigits(s.contact.phone)}`} className="flex items-center gap-1.5 hover:opacity-80">
                  <PhoneIcon size={14} /> {s.contact.phone}
                </a>
              )}
              <SocialLinks size={14} className="gap-3" />
            </div>
          </div>
        </div>
      )}

      <header
        className={cn(
          "z-40 w-full transition-[background-color,box-shadow,color] duration-300",
          s.header.sticky ? "sticky top-0" : "relative",
          overlay && "-mb-[var(--header-h)]",
        )}
        style={{
          height: "var(--header-h)",
          background: solid ? "var(--header-bg)" : "transparent",
          color: solid ? "var(--header-fg)" : "#fff",
          boxShadow: solid && scrolled ? "0 1px 0 var(--c-border)" : "none",
        }}
      >
        <div className="container-x flex h-full items-center justify-between gap-6">
          <SiteLink to="/" className="flex min-w-0 items-center gap-3">
            {s.brand.logoUrl ? (
              <img src={img(s.brand.logoUrl, 400)} alt={s.brand.name} style={{ height: "var(--logo-h)" }} className="w-auto object-contain" />
            ) : (
              <span className="flex flex-col leading-none">
                <span className="font-heading text-2xl font-semibold tracking-tight md:text-[1.7rem]">{s.brand.name}</span>
                {s.header.showTagline && s.brand.tagline && (
                  <span className="mt-1 text-[0.68rem] italic tracking-wide opacity-75">{s.brand.tagline}</span>
                )}
              </span>
            )}
          </SiteLink>

          <nav className="hidden items-center gap-8 lg:flex">
            {s.header.nav.map((n) => (
              <SiteLink
                key={n.to + n.label}
                to={n.to}
                className={cn(
                  "relative text-sm font-medium tracking-wide transition-opacity hover:opacity-100",
                  isActive(n.to) ? "opacity-100" : "opacity-75",
                )}
              >
                {n.label}
                {isActive(n.to) && <span className="absolute -bottom-1.5 left-0 h-px w-full bg-accent" />}
              </SiteLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {s.header.cta.label && (
              <SiteLink to={s.header.cta.to} className={cn("btn hidden sm:inline-flex", solid ? "btn-primary" : "btn-outline")}>
                {s.header.cta.label}
              </SiteLink>
            )}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="-mr-2 p-2 lg:hidden"
            >
              {open ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-bg text-ink transition-opacity duration-300 lg:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={{ top: "var(--header-h)" }}
        >
          <nav className="container-x flex flex-col py-6">
            {s.header.nav.map((n) => (
              <SiteLink
                key={n.to + n.label}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn("border-b border-line py-4 font-heading text-3xl", isActive(n.to) && "text-accent")}
              >
                {n.label}
              </SiteLink>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              {s.header.cta.label && (
                <SiteLink to={s.header.cta.to} onClick={() => setOpen(false)} className="btn btn-primary">
                  {s.header.cta.label}
                </SiteLink>
              )}
              {s.contact.whatsapp && (
                <a href={waLink(s.contact.whatsapp, s.contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <WhatsAppIcon /> Chat on WhatsApp
                </a>
              )}
            </div>
            <SocialLinks size={20} className="mt-8 gap-5 text-muted" />
          </nav>
        </div>
      </header>
    </>
  );
}
