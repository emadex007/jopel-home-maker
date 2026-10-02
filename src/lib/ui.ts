import { createContext, useContext } from "react";
import { SITE_DEFAULTS, type SiteSettings } from "~/lib/site-defaults";

export const SiteContext = createContext<SiteSettings>(SITE_DEFAULTS);
export const useSite = () => useContext(SiteContext);

/** Resize Unsplash images on the fly; R2 and other URLs pass through. */
export function img(url: string | undefined | null, width = 1200): string {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      if (!u.searchParams.has("auto")) u.searchParams.set("auto", "format");
      if (!u.searchParams.has("fit")) u.searchParams.set("fit", "crop");
      if (!u.searchParams.has("q")) u.searchParams.set("q", "80");
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

/** Normalise a Nigerian or international number for wa.me / tel: links. */
export function phoneDigits(phone: string): string {
  let d = (phone || "").replace(/[^\d]/g, "");
  if (d.startsWith("0") && d.length === 11) d = "234" + d.slice(1);
  return d;
}

export function waLink(phone: string, message = ""): string {
  const d = phoneDigits(phone);
  return `https://wa.me/${d}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * Which logo to show on a dark background (see-through header over a photo, footer).
 * Uses the uploaded white logo if there is one, otherwise the normal logo turned white with a CSS filter.
 */
export function whiteLogo(brand: { logoUrl: string; logoWhiteUrl?: string; autoWhiteLogo?: boolean }): { src: string; style?: { filter: string } } | null {
  if (brand.logoWhiteUrl) return { src: brand.logoWhiteUrl };
  if (!brand.logoUrl) return null;
  if (brand.autoWhiteLogo === false) return { src: brand.logoUrl };
  return { src: brand.logoUrl, style: { filter: "brightness(0) invert(1)" } };
}

export const isExternal = (to: string) => /^(https?:|mailto:|tel:|#)/.test(to);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** One stylesheet link per font, so a typo in one font name can't break the other. */
export function googleFontsHrefs(fonts: string[]): string[] {
  const unique = [...new Set(fonts.map((f) => f.trim()).filter(Boolean))];
  return unique.map(
    (f) =>
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`,
  );
}
