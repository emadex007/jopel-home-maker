import type { SiteSettings } from "~/lib/site-defaults";

const font = (name: string, fallback: string) => {
  const safe = (name || "").replace(/[^A-Za-z0-9 \-]/g, "").trim();
  return safe ? `"${safe}", ${fallback}` : fallback;
};
const color = (v: string, fallback: string) => (/^#[0-9a-fA-F]{3,8}$|^rgba?\(|^hsla?\(/.test(v?.trim() || "") ? v.trim() : fallback);
const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Turns dashboard theme settings into CSS variables used across the site. */
export function ThemeStyle({ s }: { s: SiteSettings }) {
  const t = s.theme;
  const h = s.header;
  const css = `:root{
--c-primary:${color(t.primary, "#1f1b18")};
--c-on-primary:${color(t.onPrimary, "#faf7f2")};
--c-accent:${color(t.accent, "#b08d57")};
--c-bg:${color(t.background, "#faf7f2")};
--c-surface:${color(t.surface, "#ffffff")};
--c-text:${color(t.text, "#1f1b18")};
--c-muted:${color(t.muted, "#6b645c")};
--c-border:${color(t.border, "#e7dfd3")};
--f-heading:${font(t.headingFont, "Georgia, serif")};
--f-body:${font(t.bodyFont, "system-ui, sans-serif")};
--base-font:${num(t.baseFontSize, 16, 12, 22)}px;
--radius:${num(t.radius, 4, 0, 40)}px;
--container:${num(t.containerWidth, 1200, 800, 1800)}px;
--section-y:${num(t.sectionSpacing, 96, 24, 240)}px;
--header-h:${num(h.height, 84, 56, 160)}px;
--logo-h:${num(h.logoHeight, 44, 20, 140)}px;
--header-bg:${color(h.background, "#faf7f2")};
--header-fg:${color(h.textColor, "#1f1b18")};
--footer-bg:${color(s.footer.background, "#1f1b18")};
--footer-fg:${color(s.footer.textColor, "#e9e2d6")};
--topbar-bg:${color(s.topBar.background, "#1f1b18")};
--topbar-fg:${color(s.topBar.textColor, "#e9ddc8")};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
