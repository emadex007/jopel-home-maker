// The business name used in browser-tab titles. Set from the dashboard settings when the site loads,
// so page titles never need the client's name hard-coded.
import { SITE_DEFAULTS } from "~/lib/site-defaults";

let brandName = SITE_DEFAULTS.brand.name;

export function setBrandName(name: string | undefined) {
  if (name) brandName = name;
}

/** "Contact Us" → "Contact Us | <Business name>" */
export const pageTitle = (page: string) => `${page} | ${brandName}`;
