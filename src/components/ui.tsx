import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn, img } from "~/lib/ui";
import { ArrowLeft, ArrowRight, CheckIcon, CloseIcon, ImagesIcon } from "./Icons";
import { useCallback, useEffect, useState } from "react";
import type { ProjectPhoto, ProjectSummary } from "~/server/db";

export function PageHero({ title, intro, image, eyebrow }: { title: string; intro?: string; image?: string; eyebrow?: string }) {
  return (
    <section className="relative flex min-h-[46vh] items-end overflow-hidden bg-primary text-white">
      {image && <img src={img(image, 2200)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
      <div className="container-x relative pb-14 pt-32 md:pb-20">
        {eyebrow && <p className="eyebrow fade-up mb-4 !text-[color-mix(in_srgb,var(--c-accent)_70%,white)]">{eyebrow}</p>}
        <h1 className="fade-up max-w-3xl text-5xl md:text-7xl">{title}</h1>
        {intro && <p className="fade-up-2 mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{intro}</p>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div className={cn("mb-12 flex flex-col gap-6 md:mb-16", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="text-4xl md:text-5xl">{title}</h2>
        {text && <p className="mt-4 leading-relaxed text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProjectCard({ p, large = false }: { p: ProjectSummary; large?: boolean }) {
  return (
    <Link to="/portfolio/$slug" params={{ slug: p.slug }} className={cn("group block", large && "h-full")}>
      <div className={cn("img-zoom relative overflow-hidden rounded-[var(--radius)] bg-line", large ? "aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[100%]" : "aspect-[4/5]")}>
        <img src={img(p.cover_image, large ? 1400 : 900)} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-ink">
          {p.category}
        </span>
        {p.photo_count > 0 && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur">
            <ImagesIcon size={14} /> {p.photo_count}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
          <div>
            <h3 className="text-2xl md:text-[1.7rem]">{p.title}</h3>
            {(p.location || p.year) && <p className="mt-1 text-sm text-white/75">{[p.location, p.year].filter(Boolean).join(" · ")}</p>}
          </div>
          <span className="flex h-10 w-10 shrink-0 translate-x-2 items-center justify-center rounded-full bg-white text-ink opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Fullscreen photo viewer with keyboard and swipe support. */
export function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
  title,
}: {
  photos: ProjectPhoto[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
  title?: string;
}) {
  const n = photos.length;
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex]);
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} photos` : "Photos"}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm md:px-6">
        <span className="opacity-70">
          {index + 1} / {n} {title && <span className="hidden sm:inline">· {title}</span>}
        </span>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
          <CloseIcon size={26} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-20" onClick={onClose}>
        <img
          key={photo.url}
          src={img(photo.url, 2000)}
          alt={photo.caption || title || ""}
          className="fade-up max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {n > 1 && (
          <>
            <button
              onClick={(e) => (e.stopPropagation(), go(-1))}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 md:block"
            >
              <ArrowLeft size={22} />
            </button>
            <button
              onClick={(e) => (e.stopPropagation(), go(1))}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 md:block"
            >
              <ArrowRight size={22} />
            </button>
          </>
        )}
      </div>
      {photo.caption && <p className="px-6 pt-3 text-center text-sm opacity-80">{photo.caption}</p>}
      {n > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-4 md:justify-center">
          {photos.map((ph, i) => (
            <button
              key={ph.id + ph.url}
              onClick={() => onIndex(i)}
              aria-label={`Photo ${i + 1}`}
              className={cn("h-14 w-20 shrink-0 overflow-hidden rounded-sm transition-opacity", i === index ? "opacity-100 ring-2 ring-white" : "opacity-40 hover:opacity-80")}
            >
              <img src={img(ph.url, 200)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormSuccess({ title, text, refCode, children }: { title: string; text: string; refCode?: string; children?: ReactNode }) {
  return (
    <div className="fade-up rounded-[var(--radius)] border border-line bg-surface p-8 text-center md:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
        <CheckIcon size={28} />
      </div>
      <h2 className="mt-6 text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">{text}</p>
      {refCode && refCode !== "OK" && (
        <p className="mt-5 text-sm">
          Your reference: <span className="font-mono font-semibold">{refCode}</span>
        </p>
      )}
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}

/** Hidden field bots fill in; real visitors never see it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
