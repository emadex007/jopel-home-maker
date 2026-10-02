// Shared building blocks for the admin dashboard. Neutral styling so the dashboard
// stays readable whatever colours are chosen for the public site.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn, img } from "~/lib/ui";
import { CloseIcon, UploadIcon } from "~/components/Icons";

// ---------- toast ----------

type Toast = { id: number; text: string; kind: "ok" | "error" };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "fade-up rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
              t.kind === "ok" ? "bg-zinc-900 text-white" : "bg-red-600 text-white",
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- layout ----------

export function AdminPage({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, description, children, className, actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-zinc-200 bg-white p-5 md:p-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-sans text-base font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

// ---------- buttons ----------

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" };
export function Btn({ variant = "secondary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      type="button"
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-700",
        variant === "secondary" && "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
        variant === "danger" && "border border-red-200 bg-white text-red-600 hover:bg-red-50",
        variant === "ghost" && "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        className,
      )}
    />
  );
}

// ---------- form fields ----------

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function Label({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function TextInput({ label, hint, value, onChange, className, ...p }: { label: string; hint?: string; value: string; onChange: (v: string) => void; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <Label label={label} hint={hint} className={className}>
      <input {...p} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Label>
  );
}

export function TextArea({ label, hint, value, onChange, rows = 4, className }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number; className?: string }) {
  return (
    <Label label={label} hint={hint} className={className}>
      <textarea value={value ?? ""} rows={rows} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "resize-y")} />
    </Label>
  );
}

export function SelectInput({ label, hint, value, onChange, options, className }: { label: string; hint?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <Label label={label} hint={hint} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

export function NumberInput({ label, hint, value, onChange, min, max, step = 1, unit, className }: { label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; className?: string }) {
  return (
    <Label label={label} hint={hint} className={className}>
      <div className="flex items-center gap-3">
        {min !== undefined && max !== undefined && (
          <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-zinc-900" />
        )}
        <div className="relative w-28 shrink-0">
          <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={cn(inputCls, unit && "pr-9")} />
          {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{unit}</span>}
        </div>
      </div>
    </Label>
  );
}

export function ColorInput({ label, hint, value, onChange, className }: { label: string; hint?: string; value: string; onChange: (v: string) => void; className?: string }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <Label label={label} hint={hint} className={className}>
      <div className="flex items-center gap-2">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "font-mono uppercase")} maxLength={30} />
      </div>
    </Label>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-medium text-zinc-800">{label}</span>
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-zinc-900" : "bg-zinc-300")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

// ---------- uploads ----------

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
  return data.url;
}

export function ImageField({ label, hint, value, onChange, aspect = "aspect-video" }: { label: string; hint?: string; value: string; onChange: (v: string) => void; aspect?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}</span>
      <div className="flex gap-3">
        <div className={cn("relative w-40 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100", aspect)}>
          {value ? <img src={img(value, 400)} alt="" className="h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">No image</span>}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium">Uploading…</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => ref.current?.click()} disabled={busy}>
              <UploadIcon size={14} /> Upload
            </Btn>
            {value && (
              <Btn size="sm" variant="ghost" onClick={() => onChange("")}>
                <CloseIcon size={14} /> Remove
              </Btn>
            )}
          </div>
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image link" className={cn(inputCls, "text-xs")} />
          {hint && <span className="text-xs text-zinc-500">{hint}</span>}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

// ---------- modal ----------

export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("fade-up flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="font-sans text-base font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100">
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- misc ----------

const STATUS_COLORS: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  unread: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  quoted: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  won: "bg-emerald-100 text-emerald-800",
  read: "bg-zinc-100 text-zinc-600",
  cancelled: "bg-zinc-100 text-zinc-500",
  lost: "bg-zinc-100 text-zinc-500",
  published: "bg-emerald-100 text-emerald-800",
  draft: "bg-zinc-100 text-zinc-600",
  hidden: "bg-zinc-100 text-zinc-600",
  featured: "bg-amber-100 text-amber-800",
};

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold capitalize", STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-700")}>
      {children ?? status}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <p className="font-sans font-semibold text-zinc-800">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** "2026-10-02 18:40:11" (UTC from SQLite) → local readable date. */
export function fmtDate(s: string | number | undefined, withTime = true) {
  if (!s) return "";
  const str = String(s);
  const d = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(str) ? str.replace(" ", "T") + "Z" : str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) });
}

/** Wraps a server call: shows a toast on error, returns the result or null. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | null> => {
      setBusy(true);
      try {
        const res = await fn();
        const r = res as { ok?: boolean; error?: string };
        if (r && typeof r === "object" && r.ok === false) {
          toast(r.error || "Something went wrong", "error");
          return null;
        }
        if (success) toast(success);
        return res;
      } catch (e) {
        toast((e as Error)?.message || "Something went wrong", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { busy, run };
}
