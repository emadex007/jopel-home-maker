import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20, props: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const MenuIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ArrowLeft = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const PhoneIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>
);
export const MailIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);
export const PinIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const ClockIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const CheckIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
export const UploadIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
);
export const ImagesIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="3" y="5" width="15" height="14" rx="1.5" /><path d="M7 3h13a1 1 0 011 1v12M3 15l4-4 4 4 3-3 4 4" /></svg>
);

// Brand icons (filled)
const fill = (size = 18, p: P) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, ...p });

export const WhatsAppIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M12.04 2a9.9 9.9 0 00-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.2 8.2 0 1112.84 1.39 8.14 8.14 0 01-6 2.34zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8s-.39-.12-.55.12-.63.8-.78.96-.29.19-.53.06a6.7 6.7 0 01-3.33-2.91c-.25-.43.25-.4.72-1.34a.45.45 0 00-.02-.43c-.06-.12-.55-1.33-.76-1.82s-.4-.41-.55-.42h-.47a.9.9 0 00-.65.3 2.74 2.74 0 00-.86 2.04 4.77 4.77 0 001 2.53 10.9 10.9 0 004.18 3.7c1.56.67 2.17.73 2.95.62a2.52 2.52 0 001.65-1.17 2.05 2.05 0 00.14-1.17c-.06-.1-.22-.16-.46-.28z" /></svg>
);
export const InstagramIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M12 2.2c3.2 0 3.6 0 4.8.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.8.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 4.66a5.14 5.14 0 100 10.28 5.14 5.14 0 000-10.28zm0 8.47a3.33 3.33 0 110-6.66 3.33 3.33 0 010 6.66zm5.34-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" /></svg>
);
export const FacebookIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.26-1.5 1.56-1.5h1.66V4.45A22 22 0 0014.3 4.3c-2.4 0-4.04 1.47-4.04 4.16v2.34H7.56V14h2.7v8z" /></svg>
);
export const TikTokIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M19.6 8.1a6.3 6.3 0 01-3.7-1.2v6.6a5.9 5.9 0 11-5.1-5.85v3.13a2.86 2.86 0 102.03 2.73V2h3.06a3.7 3.7 0 003.7 3.4z" /></svg>
);
export const XIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77zm-1.08 16.2h1.7L7.4 4.73H5.58z" /></svg>
);
export const LinkedInIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M4.98 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 9.75h4V21H3zM9.5 9.75h3.83v1.54h.06a4.2 4.2 0 013.78-2.08c4.04 0 4.79 2.66 4.79 6.12V21h-4v-5c0-1.2-.02-2.73-1.66-2.73s-1.92 1.3-1.92 2.64V21H9.5z" /></svg>
);
export const YouTubeIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M23 7.2a3 3 0 00-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 001 7.2 31 31 0 00.6 12a31 31 0 00.5 4.8 3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1 31 31 0 00.5-4.8 31 31 0 00-.6-4.8zM9.8 15V9l5.8 3z" /></svg>
);
export const PinterestIcon = ({ size, ...p }: P) => (
  <svg {...fill(size, p)}><path d="M12 2a10 10 0 00-3.64 19.3c-.09-.78-.17-1.98.04-2.84l1.17-4.96s-.3-.6-.3-1.48c0-1.39.8-2.42 1.8-2.42.85 0 1.26.64 1.26 1.4 0 .86-.55 2.14-.83 3.32-.24 1 .5 1.8 1.48 1.8 1.77 0 3.14-1.87 3.14-4.57 0-2.39-1.72-4.06-4.17-4.06a4.32 4.32 0 00-4.5 4.33c0 .86.33 1.78.74 2.28a.3.3 0 01.07.29l-.28 1.13c-.04.18-.15.22-.33.13-1.25-.58-2.03-2.4-2.03-3.87 0-3.15 2.29-6.04 6.6-6.04 3.46 0 6.16 2.47 6.16 5.77 0 3.44-2.17 6.22-5.18 6.22-1.01 0-1.97-.53-2.29-1.15l-.62 2.38a11 11 0 01-1.24 2.62A10 10 0 1012 2z" /></svg>
);
