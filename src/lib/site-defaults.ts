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
    testimonialsTitle: string;
    sliderSeconds: number; // how long each testimonial shows before sliding
    showClients: boolean;
    clientsTitle: string;
    showFaq: boolean;
    faqTitle: string;
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
    profileEyebrow: string;
    profileTitle: string;
    profileText: string; // first section on the About page
    establishedYear: number; // used to work out "years in business" automatically
    stats: { value: string; label: string }[]; // counting numbers; "{years}" = years since established
    sloganEyebrow: string;
    slogan: string;
    sloganText: string;
    sloganPromise: string;
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
    contactShowFaq: boolean;
    formsImage: string;
  };
  contact: {
    phone: string;
    whatsapp: string; // number used for the WhatsApp button
    whatsappMessage: string;
    showWhatsappButton: boolean;
    email: string;
    email2: string; // optional second email
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
  quotes: {
    numberPrefix: string; // e.g. JP-Q → JP-Q-0001
    validDays: number; // default validity for new quotations
    intro: string; // shown above the items
    notes: string; // default notes on new quotations
    terms: string; // shown at the bottom of every quotation
    acceptMessage: string; // shown to the client after accepting
  };
  chat: {
    enabled: boolean;
    title: string;
    greeting: string; // first message visitors see
    offlineMessage: string; // shown when no staff has been active recently
    buttonLabel: string;
  };
};

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const SITE_DEFAULTS: SiteSettings = {
  brand: {
    name: "Jo-pearl Homemakers",
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
    text: "Since 2006 · Over 3,000 projects delivered · Call or WhatsApp +234 703 130 6790",
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
    eyebrow: "Since 2006 · Luxury Designs",
    title: "Luxury designs, from carcass to finishing",
    subtitle:
      "Project design and execution for residential and commercial spaces. Over 3,000 projects delivered in 20 years, always with genuine materials and to your exact specification.",
    primaryCta: { label: "Our Services", to: "/services" },
    secondaryCta: { label: "Get a Quote", to: "/quote" },
    align: "left",
  },
  home: {
    introEyebrow: "Welcome to Jo-pearl",
    introTitle: "Extraordinary designs, delivered with genuine materials.",
    introText:
      "Jo-pearl Homemakers International was established on 10th July 2006. We design and execute residential and commercial projects from carcass to finishing and furnishing, always according to our clients' specifications and preferences.\n\nWe create extraordinary designs for every project category, with high professionalism and, most importantly, genuine materials. We don't compromise, and we always deliver the very best.",
    introImage: U("1600210491892-03d54c0aaf87", 1400),
    stats: [
      { value: "2006", label: "Established" },
      { value: "3,000+", label: "Projects delivered" },
      { value: "20 yrs", label: "Of excellence" },
    ],
    showServices: true,
    showProjects: true,
    showProcess: true,
    showTestimonials: true,
    testimonialsTitle: "What our clients say",
    sliderSeconds: 6,
    showClients: true,
    clientsTitle: "Clients & partners we've worked with",
    showFaq: true,
    faqTitle: "Frequently asked questions",
    showCta: true,
    process: [
      { title: "Brief & site visit", text: "We listen to your needs, visit the site and agree your specifications, style and budget." },
      { title: "Design & rendering", text: "Space planning, drawings and 3D renders, so you see the finished space before work starts." },
      { title: "Execution", text: "Hardware and software finishing, from carcass to furnishing, using genuine materials only." },
      { title: "Handover & care", text: "A finished masterpiece, then facility management to keep it at its best." },
    ],
    ctaTitle: "Ready to experience the difference?",
    ctaText: "Tell us about your residential or commercial project and we'll get back to you with ideas and a quotation.",
    ctaImage: U("1616594039964-ae9021a400a0", 2000),
  },
  about: {
    heroImage: U("1583847268964-b28dc8f51f92", 2200),
    title: "About Jo-pearl Homemakers International",
    intro: "Established on 10th July 2006. Over 3,000 projects delivered across 20 years.",
    profileEyebrow: "Company profile",
    profileTitle: "Jopearl Homemakers International",
    profileText:
      "Jopearl Homemakers International was established on the 10th of July 2006. We have delivered over 3,000 projects over the past 20 years, always ensuring excellent service delivery according to our clients' specifications and preferences.\n\nWe design and execute from carcass to finishing and furnishing, for both residential and commercial projects.",
    establishedYear: 2006,
    stats: [
      { value: "3000+", label: "Projects delivered" },
      { value: "{years}+", label: "Years of experience" },
      { value: "2006", label: "Year established" },
    ],
    sloganEyebrow: "Our slogan",
    slogan: "...experience the difference",
    sloganText:
      "Our projects are exceptional and always a masterpiece, hence our slogan. For several years since 2006, we have created mind-blowing innovations and unique designs for both residential and commercial projects.",
    sloganPromise:
      "We create the most extraordinary designs for all project categories, with high professionalism and, most importantly, genuine materials. We don't compromise, and we always deliver the very BEST.",
    story:
      "Every project we take on, from a single room to a complete building, is handled by one team: from the first design and rendering, through space planning and finishing, to the final furnishing and facility management.\n\nWe look forward to partnering with you on your project, and we're committed to rendering exceptional service delivery.\n\nJopearl Homemakers is a member of Jopearl Int'l Ltd (RC 958458).",
    image: U("1616486029423-aaa4789e8c9a", 1400),
    values: [
      { title: "Genuine materials", text: "We never cut corners on materials. Quality you can see and feel for years." },
      { title: "Your specification", text: "Every project is delivered according to your specifications and preferences." },
      { title: "Carcass to furnishing", text: "One team from the bare structure to the final finishing and furnishing." },
      { title: "Only the very best", text: "We don't compromise. Every project is designed and delivered as a masterpiece." },
    ],
  },
  pages: {
    portfolioTitle: "Our Portfolio",
    portfolioIntro: "A selection of the residential and commercial projects we've designed and delivered.",
    portfolioImage: U("1600494448850-6013c64ba722", 2200),
    servicesTitle: "Our Services",
    servicesIntro: "Design, planning, finishing, furnishing and facility management: one team for the whole life of your space.",
    servicesImage: U("1671197244266-73129c97c096", 2200),
    bookTitle: "Book a Consultation",
    bookIntro: "Choose a day that suits you and we'll confirm your site visit or call.",
    quoteTitle: "Request a Quote",
    quoteIntro: "Tell us about your project. The more detail you share, the more accurate our quotation will be.",
    contactTitle: "Contact Us",
    contactIntro: "Call, WhatsApp, email or visit our office in Lekki. We look forward to partnering with you on your project.",
    contactShowFaq: true,
    formsImage: U("1606744888344-493238951221", 2200),
  },
  contact: {
    phone: "+234 703 130 6790",
    whatsapp: "+234 703 130 6790",
    whatsappMessage: "Hello Jo-pearl Homemakers, I'd like to make an enquiry about a project.",
    showWhatsappButton: true,
    email: "info@jopearlhomemakers.com",
    email2: "jopearlgroupintl@gmail.com",
    address: "Friends Colony Estate, Osapa London,\nLekki, Lagos, Nigeria",
    hours: "",
    mapEmbedUrl: "",
  },
  social: {
    instagram: "https://www.instagram.com/jopearlhomemakersintl/",
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
      "Established on 10th July 2006, Jopearl Homemakers International has delivered over 3,000 residential and commercial projects, designed and executed from carcass to finishing and furnishing. RC 958458 · A member of Jopearl Int'l Ltd.",
    showServices: true,
    showContact: true,
    showSocial: true,
    showLogo: true,
    logoHeight: 56,
    copyright: "© {year} {name}. All rights reserved.",
  },
  seo: {
    title: "Jo-pearl Homemakers | Interior Design, Finishing & Furnishing in Lagos",
    description:
      "Since 2006, Jo-pearl Homemakers International has delivered over 3,000 residential and commercial projects: design and rendering, space planning, interior and exterior finishing, furnishing and facility management. Lekki, Lagos.",
    ogImage: U("1618221195710-dd6b41faaea6", 1200),
  },
  quotes: {
    numberPrefix: "JP-Q",
    validDays: 14,
    intro: "Thank you for choosing Jo-pearl Homemakers International. Below is our quotation for your project.",
    notes: "",
    terms:
      "Prices are in Naira and valid until the date shown. Final costs may change if the scope of work changes after a site visit. Work begins once the quotation is accepted and agreed with our team.",
    acceptMessage: "Thank you for choosing Jo-pearl! We've received your acceptance and our team will contact you shortly to agree the next steps.",
  },
  chat: {
    enabled: true,
    title: "Chat with Jo-pearl",
    greeting: "Hi there! 👋 Ask us anything about your project, our services or a quotation. We'll reply as soon as we can.",
    offlineMessage: "We're away right now, but leave a message and we'll reply as soon as we're back. For a faster answer, message us on WhatsApp.",
    buttonLabel: "Chat with us",
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
