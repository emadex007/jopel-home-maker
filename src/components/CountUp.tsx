import { useEffect, useRef, useState } from "react";

/**
 * Number that counts up when it scrolls into view.
 * Accepts values like "3000+", "20+", "2006", "98%". "{years}" is replaced with years since `establishedYear`.
 */
export function CountUp({ value, establishedYear, duration = 1800 }: { value: string; establishedYear?: number; duration?: number }) {
  const years = establishedYear ? Math.max(0, new Date().getFullYear() - establishedYear) : 0;
  const text = value.replace("{years}", String(years));
  const m = text.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
  const target = m ? Number(m[2].replace(/,/g, "")) : NaN;
  const prefix = m?.[1] ?? "";
  const suffix = m?.[3] ?? "";
  const isYear = target >= 1900 && target <= 2100 && !m?.[2].includes(",");
  const start = isYear ? target - 30 : 0;

  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(target);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(target) || ran) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setCurrent(start);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setRan(true);
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setCurrent(Math.round(start + (target - start) * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, start, duration, ran]);

  if (!Number.isFinite(target)) return <span>{text}</span>;
  const shown = isYear ? String(current) : current.toLocaleString("en-NG");
  return (
    <span ref={ref} aria-label={text} className="tabular-nums">
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
