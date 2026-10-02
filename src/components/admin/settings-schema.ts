// Describes every field in the Site settings editor. Add a field here and it appears in the dashboard.
import type { SettingsKey, SiteSettings } from "~/lib/site-defaults";

type Base = { k: string; label: string; hint?: string; wide?: boolean };
export type Field =
  | (Base & { type: "text" | "textarea" | "color" | "image" | "toggle" | "font" | "link" })
  | (Base & { type: "number"; min: number; max: number; step?: number; unit?: string })
  | (Base & { type: "select"; options: { value: string; label: string }[] })
  | (Base & { type: "links" })
  | (Base & { type: "list"; itemLabel: string; itemFields: { k: string; label: string; type: "text" | "textarea" }[] });

export type Section = { key: SettingsKey; title: string; description?: string; fields: Field[] };
export type Tab = { id: string; label: string; previewPath: string; sections: Section[] };

export const FONT_OPTIONS = [
  "Cormorant Garamond",
  "Playfair Display",
  "DM Serif Display",
  "Lora",
  "Libre Baskerville",
  "Marcellus",
  "Bodoni Moda",
  "Manrope",
  "Inter",
  "DM Sans",
  "Poppins",
  "Montserrat",
  "Jost",
  "Lato",
  "Nunito Sans",
  "Raleway",
  "Outfit",
];

export const COLOR_PRESETS: { name: string; theme: Partial<SiteSettings["theme"]>; header: Partial<SiteSettings["header"]>; footer: Partial<SiteSettings["footer"]>; topBar: Partial<SiteSettings["topBar"]> }[] = [
  {
    name: "Pearl & Gold",
    theme: { primary: "#1F1B18", onPrimary: "#FAF7F2", accent: "#B08D57", background: "#FAF7F2", surface: "#FFFFFF", text: "#1F1B18", muted: "#6B645C", border: "#E7DFD3" },
    header: { background: "#FAF7F2", textColor: "#1F1B18" },
    footer: { background: "#1F1B18", textColor: "#E9E2D6" },
    topBar: { background: "#1F1B18", textColor: "#E9DDC8" },
  },
  {
    name: "Charcoal & Terracotta",
    theme: { primary: "#2B2B2B", onPrimary: "#FFFFFF", accent: "#C0623B", background: "#F7F3EF", surface: "#FFFFFF", text: "#222222", muted: "#6E665F", border: "#E6DDD4" },
    header: { background: "#F7F3EF", textColor: "#222222" },
    footer: { background: "#2B2B2B", textColor: "#EDE6DF" },
    topBar: { background: "#C0623B", textColor: "#FFFFFF" },
  },
  {
    name: "Sage & Cream",
    theme: { primary: "#3E4A3D", onPrimary: "#F6F3EC", accent: "#9AA57F", background: "#F6F3EC", surface: "#FFFFFF", text: "#283027", muted: "#69705F", border: "#E1DED2" },
    header: { background: "#F6F3EC", textColor: "#283027" },
    footer: { background: "#3E4A3D", textColor: "#E8EADF" },
    topBar: { background: "#3E4A3D", textColor: "#E8EADF" },
  },
  {
    name: "Navy & Brass",
    theme: { primary: "#14213D", onPrimary: "#FFFFFF", accent: "#B8913F", background: "#F8F7F4", surface: "#FFFFFF", text: "#14213D", muted: "#5B6478", border: "#E3E1DA" },
    header: { background: "#FFFFFF", textColor: "#14213D" },
    footer: { background: "#14213D", textColor: "#E3E6EE" },
    topBar: { background: "#14213D", textColor: "#E9D9B4" },
  },
  {
    name: "Blush & Bronze",
    theme: { primary: "#4A3B36", onPrimary: "#FFF8F4", accent: "#A9754F", background: "#FBF4F0", surface: "#FFFFFF", text: "#3A2E2A", muted: "#7A6A64", border: "#EEDFD8" },
    header: { background: "#FBF4F0", textColor: "#3A2E2A" },
    footer: { background: "#4A3B36", textColor: "#F2E5DE" },
    topBar: { background: "#A9754F", textColor: "#FFFFFF" },
  },
];

const PAIRS = (k: string, label: string, itemLabel: string, a: [string, string], b: [string, string, ("text" | "textarea")?]): Field => ({
  k,
  label,
  type: "list",
  itemLabel,
  wide: true,
  itemFields: [
    { k: a[0], label: a[1], type: "text" },
    { k: b[0], label: b[1], type: b[2] ?? "text" },
  ],
});

export const TABS: Tab[] = [
  {
    id: "brand",
    label: "Brand",
    previewPath: "/",
    sections: [
      {
        key: "brand",
        title: "Business name & logo",
        fields: [
          { k: "name", label: "Business name", type: "text" },
          { k: "tagline", label: "Tagline", type: "text" },
          { k: "logoUrl", label: "Logo", type: "image", hint: "A transparent PNG works best. Leave empty to show the name as text." },
          {
            k: "logoWhiteUrl",
            label: "White logo (optional)",
            type: "image",
            hint: "Used over the home photo and in the footer. If empty, the normal logo is turned white automatically.",
          },
          { k: "autoWhiteLogo", label: "Turn the logo white over photos & in the footer", type: "toggle", hint: "Works best with a transparent PNG logo. Turn off if your logo has its own background." },
          { k: "faviconUrl", label: "Browser tab icon (favicon)", type: "image", hint: "A small square PNG or .ico." },
        ],
      },
    ],
  },
  {
    id: "colours",
    label: "Colours & fonts",
    previewPath: "/",
    sections: [
      {
        key: "theme",
        title: "Colours",
        description: "Pick a preset above, or set each colour yourself.",
        fields: [
          { k: "primary", label: "Main colour (buttons, dark sections)", type: "color" },
          { k: "onPrimary", label: "Text on main colour", type: "color" },
          { k: "accent", label: "Accent (gold details, labels)", type: "color" },
          { k: "background", label: "Page background", type: "color" },
          { k: "surface", label: "Cards & forms background", type: "color" },
          { k: "text", label: "Text colour", type: "color" },
          { k: "muted", label: "Soft text colour", type: "color" },
          { k: "border", label: "Lines & borders", type: "color" },
          { k: "headingFont", label: "Heading font", type: "font" },
          { k: "bodyFont", label: "Body font", type: "font" },
        ],
      },
    ],
  },
  {
    id: "layout",
    label: "Sizes & layout",
    previewPath: "/",
    sections: [
      {
        key: "theme",
        title: "Page layout",
        fields: [
          { k: "containerWidth", label: "Content width", type: "number", min: 900, max: 1600, step: 20, unit: "px", hint: "How wide the content can get on big screens." },
          { k: "sectionSpacing", label: "Space between sections", type: "number", min: 32, max: 200, step: 4, unit: "px" },
          { k: "baseFontSize", label: "Text size", type: "number", min: 14, max: 20, step: 1, unit: "px", hint: "Scales all text on the site." },
          { k: "radius", label: "Corner roundness", type: "number", min: 0, max: 24, step: 1, unit: "px", hint: "0 = sharp corners." },
        ],
      },
      {
        key: "header",
        title: "Header size",
        fields: [
          { k: "height", label: "Header height", type: "number", min: 56, max: 140, step: 2, unit: "px" },
          { k: "logoHeight", label: "Logo height", type: "number", min: 20, max: 120, step: 2, unit: "px" },
        ],
      },
      {
        key: "hero",
        title: "Home banner size",
        fields: [
          { k: "height", label: "Banner height", type: "number", min: 40, max: 100, step: 2, unit: "% screen" },
          { k: "overlay", label: "Darkness over photo", type: "number", min: 0, max: 0.9, step: 0.05, hint: "Higher = easier to read the text on top." },
          { k: "align", label: "Text alignment", type: "select", options: [{ value: "left", label: "Left" }, { value: "center", label: "Centre" }] },
        ],
      },
    ],
  },
  {
    id: "header",
    label: "Header",
    previewPath: "/about",
    sections: [
      {
        key: "header",
        title: "Header",
        fields: [
          { k: "background", label: "Background colour", type: "color" },
          { k: "textColor", label: "Text colour", type: "color" },
          { k: "sticky", label: "Stay at the top when scrolling", type: "toggle" },
          { k: "transparentOnHome", label: "See-through over the home banner", type: "toggle" },
          { k: "showTagline", label: "Show tagline under the name", type: "toggle" },
          { k: "cta", label: "Header button", type: "link" },
          { k: "nav", label: "Menu links", type: "links", wide: true, hint: "Pages: / (home), /about, /services, /portfolio, /book, /quote, /contact, or any full web link." },
        ],
      },
      {
        key: "topBar",
        title: "Announcement bar (above the header)",
        fields: [
          { k: "show", label: "Show announcement bar", type: "toggle" },
          { k: "text", label: "Message", type: "text", wide: true },
          { k: "background", label: "Background colour", type: "color" },
          { k: "textColor", label: "Text colour", type: "color" },
        ],
      },
    ],
  },
  {
    id: "hero",
    label: "Home banner",
    previewPath: "/",
    sections: [
      {
        key: "hero",
        title: "Home page banner",
        fields: [
          { k: "image", label: "Background photo", type: "image", wide: true },
          { k: "eyebrow", label: "Small label above the title", type: "text" },
          { k: "title", label: "Title", type: "textarea" },
          { k: "subtitle", label: "Subtitle", type: "textarea", wide: true },
          { k: "primaryCta", label: "Main button", type: "link" },
          { k: "secondaryCta", label: "Second button", type: "link" },
        ],
      },
    ],
  },
  {
    id: "home",
    label: "Home page",
    previewPath: "/",
    sections: [
      {
        key: "home",
        title: "Welcome section",
        fields: [
          { k: "introEyebrow", label: "Small label", type: "text" },
          { k: "introTitle", label: "Title", type: "textarea" },
          { k: "introText", label: "Text", type: "textarea", wide: true },
          { k: "introImage", label: "Photo", type: "image", wide: true },
          { ...PAIRS("stats", "Numbers (e.g. 50+ projects)", "Number", ["value", "Number"], ["label", "Label"]), hint: "Only add real figures. Hidden when empty." },
          { k: "showServices", label: "Show services section", type: "toggle" },
          { k: "showProjects", label: "Show featured projects", type: "toggle" },
          { k: "showProcess", label: "Show 'How we work' steps", type: "toggle" },
          { k: "showTestimonials", label: "Show testimonials slider", type: "toggle", hint: "Appears once at least one testimonial is switched on." },
          { k: "testimonialsTitle", label: "Testimonials title", type: "text" },
          { k: "sliderSeconds", label: "Seconds per testimonial", type: "number", min: 3, max: 15, step: 1, unit: "sec" },
          { k: "showClients", label: "Show clients & partners logos", type: "toggle", hint: "Appears once logos are added under Clients & partners." },
          { k: "clientsTitle", label: "Clients & partners title", type: "text" },
          { k: "showFaq", label: "Show FAQs on the home page", type: "toggle", hint: "Edit the questions under FAQs in the menu." },
          { k: "faqTitle", label: "FAQ title", type: "text" },
          { k: "showCta", label: "Show closing call-to-action", type: "toggle" },
          PAIRS("process", "'How we work' steps", "Step", ["title", "Step title"], ["text", "Description", "textarea"]),
          { k: "ctaTitle", label: "Closing title", type: "text", wide: true },
          { k: "ctaText", label: "Closing text", type: "textarea", wide: true },
          { k: "ctaImage", label: "Closing background photo", type: "image", wide: true },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "About page",
    previewPath: "/about",
    sections: [
      {
        key: "about",
        title: "About page",
        fields: [
          { k: "heroImage", label: "Top banner photo", type: "image", wide: true },
          { k: "title", label: "Title", type: "text" },
          { k: "intro", label: "Intro line", type: "text" },
          { k: "story", label: "Your story", type: "textarea", wide: true, hint: "Leave a blank line between paragraphs." },
          { k: "image", label: "Story photo", type: "image", wide: true },
          PAIRS("values", "Values", "Value", ["title", "Title"], ["text", "Description", "textarea"]),
        ],
      },
    ],
  },
  {
    id: "pages",
    label: "Other pages",
    previewPath: "/portfolio",
    sections: [
      {
        key: "pages",
        title: "Page titles & banners",
        fields: [
          { k: "portfolioTitle", label: "Portfolio title", type: "text" },
          { k: "portfolioIntro", label: "Portfolio intro", type: "text" },
          { k: "portfolioImage", label: "Portfolio banner", type: "image", wide: true },
          { k: "servicesTitle", label: "Services title", type: "text" },
          { k: "servicesIntro", label: "Services intro", type: "text" },
          { k: "servicesImage", label: "Services banner", type: "image", wide: true },
          { k: "bookTitle", label: "Booking page title", type: "text" },
          { k: "bookIntro", label: "Booking page intro", type: "text" },
          { k: "quoteTitle", label: "Quote page title", type: "text" },
          { k: "quoteIntro", label: "Quote page intro", type: "text" },
          { k: "contactTitle", label: "Contact page title", type: "text" },
          { k: "contactIntro", label: "Contact page intro", type: "text" },
          { k: "contactShowFaq", label: "Show FAQs on the contact page", type: "toggle" },
          { k: "formsImage", label: "Banner for booking, quote & contact pages", type: "image", wide: true },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Contact & social",
    previewPath: "/contact",
    sections: [
      {
        key: "contact",
        title: "Contact details",
        fields: [
          { k: "phone", label: "Phone number", type: "text" },
          { k: "whatsapp", label: "WhatsApp number", type: "text", hint: "e.g. 0803 000 0000 or +234 803 000 0000" },
          { k: "whatsappMessage", label: "WhatsApp starting message", type: "textarea", wide: true },
          { k: "email", label: "Email", type: "text", hint: "Also where new enquiries are emailed, unless ADMIN_NOTIFY_EMAIL is set." },
          { k: "hours", label: "Opening hours", type: "text" },
          { k: "address", label: "Address", type: "textarea", wide: true },
          { k: "mapEmbedUrl", label: "Google Maps embed link", type: "text", wide: true, hint: "Google Maps → Share → Embed a map → copy only the link inside src=\"…\"." },
        ],
      },
      {
        key: "social",
        title: "Social media links",
        description: "Paste full links. Empty ones are hidden.",
        fields: [
          { k: "instagram", label: "Instagram", type: "text" },
          { k: "facebook", label: "Facebook", type: "text" },
          { k: "tiktok", label: "TikTok", type: "text" },
          { k: "x", label: "X (Twitter)", type: "text" },
          { k: "linkedin", label: "LinkedIn", type: "text" },
          { k: "youtube", label: "YouTube", type: "text" },
          { k: "pinterest", label: "Pinterest", type: "text" },
        ],
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    previewPath: "/contact",
    sections: [
      {
        key: "footer",
        title: "Footer",
        fields: [
          { k: "background", label: "Background colour", type: "color" },
          { k: "textColor", label: "Text colour", type: "color" },
          { k: "about", label: "About text", type: "textarea", wide: true },
          { k: "copyright", label: "Copyright line", type: "text", wide: true, hint: "{year} and {name} are filled in automatically." },
          { k: "showServices", label: "Show services list", type: "toggle" },
          { k: "showContact", label: "Show contact details", type: "toggle" },
          { k: "showSocial", label: "Show social icons", type: "toggle" },
          { k: "showLogo", label: "Show the white logo (instead of the name)", type: "toggle", hint: "Uses the logo from the Brand tab." },
          { k: "logoHeight", label: "Footer logo height", type: "number", min: 24, max: 140, step: 2, unit: "px" },
        ],
      },
    ],
  },
  {
    id: "quotes",
    label: "Quotations",
    previewPath: "/",
    sections: [
      {
        key: "quotes",
        title: "Quotation defaults",
        description: "Used for every new quotation. You can still change them on each quote.",
        fields: [
          { k: "validDays", label: "Valid for", type: "number", min: 1, max: 120, step: 1, unit: "days" },
          { k: "numberPrefix", label: "Number prefix", type: "text", hint: "e.g. JP-Q gives JP-Q-0001, JP-Q-0002…" },
          { k: "intro", label: "Intro line on the quotation", type: "textarea", wide: true },
          { k: "notes", label: "Default notes", type: "textarea", wide: true, hint: "Pre-filled on new quotations. Leave empty for none." },
          { k: "terms", label: "Terms (bottom of every quotation)", type: "textarea", wide: true },
          { k: "acceptMessage", label: "Message after the client accepts", type: "textarea", wide: true },
        ],
      },
    ],
  },
  {
    id: "chat",
    label: "Live chat",
    previewPath: "/",
    sections: [
      {
        key: "chat",
        title: "Website chat",
        description: "The chat bubble sits bottom-right; the WhatsApp button bottom-left.",
        fields: [
          { k: "enabled", label: "Show the chat bubble on the website", type: "toggle" },
          { k: "buttonLabel", label: "Bubble label", type: "text" },
          { k: "title", label: "Chat window title", type: "text" },
          { k: "greeting", label: "Welcome message", type: "textarea", wide: true },
          { k: "offlineMessage", label: "Message when no one is online", type: "textarea", wide: true, hint: "Shown when no one has had the dashboard open in the last few minutes." },
        ],
      },
    ],
  },
  {
    id: "seo",
    label: "Google & sharing",
    previewPath: "/",
    sections: [
      {
        key: "seo",
        title: "Search engines & link previews",
        fields: [
          { k: "title", label: "Website title", type: "text", wide: true, hint: "Shown in Google results and the browser tab." },
          { k: "description", label: "Description", type: "textarea", wide: true, hint: "1 to 2 sentences shown under the title in Google." },
          { k: "ogImage", label: "Share image", type: "image", wide: true, hint: "Shown when the link is shared on WhatsApp, Facebook, etc." },
        ],
      },
    ],
  },
];
