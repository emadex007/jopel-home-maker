import { useCallback, useEffect, useRef, useState } from "react";
import { cn, img } from "~/lib/ui";
import { ArrowLeft, ArrowRight } from "./Icons";
import type { Client, Testimonial } from "~/server/db";

/** Auto-sliding testimonials: 1 per view on phones, 2 on tablets, 3 on desktops. Pauses on hover. */
export function TestimonialSlider({ items, seconds = 6 }: { items: Testimonial[]; seconds?: number }) {
  const [perView, setPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const update = () => setPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const view = Math.min(perView, items.length);
  const pages = Math.max(1, items.length - view + 1);
  const go = useCallback((i: number) => setIndex(((i % pages) + pages) % pages), [pages]);

  useEffect(() => {
    if (index >= pages) setIndex(0);
  }, [pages, index]);

  useEffect(() => {
    if (paused || pages <= 1) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % pages), Math.max(3, seconds) * 1000);
    return () => clearInterval(t);
  }, [paused, pages, seconds]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }
        touchX.current = null;
        setPaused(false);
      }}
    >
      <div className="overflow-hidden" aria-roledescription="carousel" aria-label="Client testimonials">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{ transform: `translateX(-${(index * 100) / view}%)` }}
        >
          {items.map((t, i) => (
            <div
              key={t.id}
              className="shrink-0 px-3"
              style={{ width: `${100 / view}%` }}
              aria-hidden={i < index || i >= index + view}
            >
              <figure className="flex h-full flex-col rounded-[var(--radius)] border border-line bg-surface p-8">
                <span className="font-heading text-6xl leading-none text-accent" aria-hidden>
                  “
                </span>
                <blockquote className="mt-2 flex-1 font-heading text-xl leading-snug">{t.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 text-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg text-on-primary">
                    {t.name.trim().slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    {t.role && <span className="block text-muted">{t.role}</span>}
                  </span>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => go(index - 1)} aria-label="Previous testimonial" className="rounded-full border border-line p-2.5 transition-colors hover:bg-primary hover:text-on-primary">
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === index}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-accent" : "w-2 bg-line hover:bg-muted")}
              />
            ))}
          </div>
          <button onClick={() => go(index + 1)} aria-label="Next testimonial" className="rounded-full border border-line p-2.5 transition-colors hover:bg-primary hover:text-on-primary">
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function Logo({ c }: { c: Client }) {
  const pic = <img src={img(c.logo, 400)} alt={c.name} loading="lazy" className="max-h-14 w-auto max-w-[160px] object-contain" />;
  return (
    <div className="flex h-20 shrink-0 items-center justify-center px-8 opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:px-12">
      {c.url ? (
        <a href={c.url} target="_blank" rel="noopener noreferrer" title={c.name}>
          {pic}
        </a>
      ) : (
        pic
      )}
    </div>
  );
}

/** Endlessly scrolling row of client logos. Greyscale until hovered. */
export function LogoMarquee({ items }: { items: Client[] }) {
  // Repeat the list so the strip is always wider than the screen, then duplicate it for a seamless loop.
  const base = items.length < 6 ? Array.from({ length: Math.ceil(6 / Math.max(1, items.length)) }, () => items).flat() : items;
  const loop = [...base, ...base];
  const duration = Math.max(20, base.length * 4);

  return (
    <div className="marquee group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="marquee-track flex w-max group-hover:[animation-play-state:paused]" style={{ animationDuration: `${duration}s` }}>
        {loop.map((c, i) => (
          <Logo key={`${c.id}-${i}`} c={c} />
        ))}
      </div>
    </div>
  );
}
