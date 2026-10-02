// Every editable part of the website lives here.
// The admin dashboard (Phase 2) saves overrides to the `settings` table, one JSON blob per section.
// Anything not saved falls back to these defaults, so the site always renders.

export type NavItem = { label: string; to: string };
export type Cta = { label: string; to: string };

export type SiteSettings = {
  brand: {
    name: string;
    tagline: string;
    logoUrl: string; // leave empty to show the name as text
    logoWhiteUrl: string; // optional white version, used over photos and in the footer
    autoWhiteLogo: boolean; // if no white version is uploaded, turn the normal logo white automatically
    faviconUrl: string;
  };
  theme: {
    primary: string; // buttons, highlights
    onPrimary: string; // text on primary buttons
    accent: string; // gold details, small labels
    background: string; // page background
    surface: string; // cards, forms
    text: string;
    muted: string;
    border: string;
    headingFont: string; // any Google Font name
    bodyFont: string;
    baseFontSize: number; // px
    radius: number; // px, corner roundness
    containerWidth: number; // px, max content width
    sectionSpacing: number; // px, vertical space between sections
  };
  topBar: {
    show: boolean;
    text: string;
    background: string;
    textColor: string;
  };
  header: {
    height: number; // px
    logoHeight: number; // px
    background: string;
    textColor: string;
    sticky: boolean;
    transparentOnHome: boolean; // sits over the hero image on the home page
    showTagline: boolean;
    nav: NavItem[];
    cta: Cta;
  };
  hero: {
    height: number; // % of screen height (vh)
    image: string;
    overlay: number; // 0 to 0.9 darkness over the image
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    align: "left" | "center";
  };
  home: {
    introEyebrow: string;
    introTitle: string;
    introText: string;
    introImage: string;
    stats: { value: string; label: string }[];
    showServices: boolean;
    showProjects: boolean;
    showProcess: boolean;
    showTestimonials: boolean;
    showCta: boolean;
    process: { title: string; text: string }[];
    ctaTitle: string;
    ctaText: string;
    ctaImage: string;
  };
  about: {
    heroImage: string;
    title: string;
    intro: string;
    story: string;
    image: string;
    values: { title: string; text: string }[];
  };
  pages: {
    portfolioTitle: string;
    portfolioIntro: string;
    portfolioImage: string;
    servicesTitle: string;
    servicesIntro: string;
    servicesImage: string;
    bookTitle: string;
    bookIntro: string;
    quoteTitle: string;
    quoteIntro: string;
    contactTitle: string;
    contactIntro: string;
    formsImage: string;
  };
  contact: {
    phone: string;
    whatsapp: string; // number used for the WhatsApp button
    whatsappMessage: string;
    showWhatsappButton: boolean;
    email: string;
    address: string;
    hours: string;
    mapEmbedUrl: string; // Google Maps "Embed a map" src URL
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    x: string;
    linkedin: string;
    youtube: string;
    pinterest: string;
  };
  footer: {
    background: string;
    textColor: string;
    about: string;
    showServices: boolean;
    showContact: boolean;
    showSocial: boolean;
    showLogo: boolean; // show the (white) logo instead of the name
    logoHeight: number; // px
    copyright: string; // {year} and {name} are replaced
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
};

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const SITE_DEFAULTS: SiteSettings = {
  brand: {
    name: "Jo-pearl Home Maker",
    tagline: "...experience the difference",
    logoUrl: "",
    logoWhiteUrl: "",
    autoWhiteLogo: true,
    faviconUrl: "",
  },
  theme: {
    primary: "#1F1B18",
    onPrimary: "#FAF7F2",
    accent: "#B08D57",
    background: "#FAF7F2",
    surface: "#FFFFFF",
    text: "#1F1B18",
    muted: "#6B645C",
    border: "#E7DFD3",
    headingFont: "Cormorant Garamond",
    bodyFont: "Manrope",
    baseFontSize: 16,
    radius: 4,
    containerWidth: 1200,
    sectionSpacing: 96,
  },
  topBar: {
    show: true,
    text: "Free consultation for new projects. Call or WhatsApp us today.",
    background: "#1F1B18",
    textColor: "#E9DDC8",
  },
  header: {
    height: 84,
    logoHeight: 44,
    background: "#FAF7F2",
    textColor: "#1F1B18",
    sticky: true,
    transparentOnHome: true,
    showTagline: true,
    nav: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Services", to: "/services" },
      { label: "Portfolio", to: "/portfolio" },
      { label: "Contact", to: "/contact" },
    ],
    cta: { label: "Get a Quote", to: "/quote" },
  },
  hero: {
    height: 92,
    image: U("1618221195710-dd6b41faaea6", 2200),
    overlay: 0.45,
    eyebrow: "Interior Design & Decoration",
    title: "Beautiful spaces, made for the way you live",
    subtitle:
      "From single rooms to complete homes and offices, Jo-pearl Home Maker designs, furnishes and finishes interiors you'll love coming back to.",
    primaryCta: { label: "View Our Work", to: "/portfolio" },
    secondaryCta: { label: "Book a Consultation", to: "/book" },
    align: "left",
  },
  home: {
    introEyebrow: "Welcome to Jo-pearl",
    introTitle: "We turn houses into homes, and offices into places people love to be.",
    introText:
      "Jo-pearl Home Maker is an interior design and decoration company. We listen to how you live and work, then plan every detail: layout, colours, furniture, lighting, curtains and finishing touches. You get one team from first idea to final handover, and a space that truly feels like you.",
    introImage: U("1600210491892-03d54c0aaf87", 1400),
    // Add real numbers from the dashboard, e.g. { value: "50+", label: "Projects completed" }.
    // Hidden while empty.
    stats: [],
    showServices: true,
    showProjects: true,
    showProcess: true,
    showTestimonials: true,
    showCta: true,
    process: [
      { title: "Consultation", text: "We visit or call to understand your space, style, budget and timeline." },
      { title: "Design & Quote", text: "You receive a design concept, mood boards and a clear, itemised quotation." },
      { title: "Sourcing & Build", text: "We source furniture and materials and manage every trade on site." },
      { title: "Styling & Handover", text: "Final styling, a walk-through with you, and a space ready to enjoy." },
    ],
    ctaTitle: "Ready to experience the difference?",
    ctaText: "Tell us about your space and we'll come back with ideas and a free quote.",
    ctaImage: U("1616594039964-ae9021a400a0", 2000),
  },
  about: {
    heroImage: U("1583847268964-b28dc8f51f92", 2200),
    title: "About Jo-pearl Home Maker",
    intro: "Interior design and decoration with care, craft and attention to detail.",
    story:
      "Jo-pearl Home Maker was built on a simple belief: everyone deserves a space that makes them feel good. We design and decorate homes, apartments, offices and commercial spaces, combining good planning with beautiful materials and finishing.\n\nWe work closely with every client, keep you updated at each stage, and take pride in delivering on time and on budget. Whether it's one room or a full building, we treat it like our own.",
    image: U("1616486029423-aaa4789e8c9a", 1400),
    values: [
      { title: "Attention to detail", text: "Every finish, fabric and fitting is chosen with purpose." },
      { title: "Honest pricing", text: "Clear, itemised quotations with no surprises." },
      { title: "On-time delivery", text: "We plan carefully and keep you updated at every stage." },
      { title: "Lasting quality", text: "Materials and workmanship that stand the test of time." },
    ],
  },
  pages: {
    portfolioTitle: "Our Portfolio",
    portfolioIntro: "A selection of homes, offices and commercial spaces we've designed and decorated.",
    portfolioImage: U("1600494448850-6013c64ba722", 2200),
    servicesTitle: "Our Services",
    servicesIntro: "Everything you need to create a beautiful, functional space, handled by one team.",
    servicesImage: U("1671197244266-73129c97c096", 2200),
    bookTitle: "Book a Consultation",
    bookIntro: "Choose a day that suits you and we'll confirm your site visit or call.",
    quoteTitle: "Request a Quote",
    quoteIntro: "Tell us about your space. The more detail you share, the more accurate our quotation will be.",
    contactTitle: "Contact Us",
    contactIntro: "Call, WhatsApp, email or send us a message. We'll get back to you as soon as possible.",
    formsImage: U("1606744888344-493238951221", 2200),
  },
  contact: {
    phone: "+234 800 000 0000",
    whatsapp: "+234 800 000 0000",
    whatsappMessage: "Hello Jo-pearl Home Maker, I'd like to make an enquiry about an interior project.",
    showWhatsappButton: true,
    email: "hello@jopearlhomemaker.com",
    address: "Your office address, City, Nigeria",
    hours: "Mon to Sat, 9:00am to 6:00pm",
    mapEmbedUrl: "",
  },
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    x: "",
    linkedin: "",
    youtube: "",
    pinterest: "",
  },
  footer: {
    background: "#1F1B18",
    textColor: "#E9E2D6",
    about:
      "Interior design and decoration for homes, apartments, offices and commercial spaces. ...experience the difference.",
    showServices: true,
    showContact: true,
    showSocial: true,
    showLogo: true,
    logoHeight: 56,
    copyright: "© {year} {name}. All rights reserved.",
  },
  seo: {
    title: "Jo-pearl Home Maker | Interior Design & Decoration",
    description:
      "Jo-pearl Home Maker designs and decorates homes, apartments, offices and commercial spaces. View our portfolio, book a consultation or request a free quote.",
    ogImage: U("1618221195710-dd6b41faaea6", 1200),
  },
};

export type SettingsKey = keyof SiteSettings;
export const SETTINGS_KEYS = Object.keys(SITE_DEFAULTS) as SettingsKey[];

/** Merge saved section values over the defaults (one level deep, arrays replaced whole). */
export function mergeSettings(saved: Partial<Record<SettingsKey, unknown>>): SiteSettings {
  const out = structuredClone(SITE_DEFAULTS) as Record<string, Record<string, unknown>>;
  for (const key of SETTINGS_KEYS) {
    const v = saved[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[key] = { ...out[key], ...(v as Record<string, unknown>) };
    }
  }
  return out as unknown as SiteSettings;
}
