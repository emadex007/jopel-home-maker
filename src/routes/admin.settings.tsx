import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { adminGetSettings, saveSettingsSection } from "~/lib/admin-api";
import { SITE_DEFAULTS, type SettingsKey, type SiteSettings } from "~/lib/site-defaults";
import { cn } from "~/lib/ui";
import { AdminPage, Btn, Card, ColorInput, ImageField, Label, NumberInput, SelectInput, TextArea, TextInput, Toggle, useAction, useToast } from "~/components/admin/kit";
import { COLOR_PRESETS, FONT_OPTIONS, TABS, type Field } from "~/components/admin/settings-schema";

type Search = { tab?: string };

export const Route = createFileRoute("/admin/settings")({
  validateSearch: (s: Record<string, unknown>): Search => ({ tab: typeof s.tab === "string" ? s.tab : undefined }),
  loader: () => adminGetSettings(),
  component: SettingsPage,
});

type Obj = Record<string, unknown>;

function SettingsPage() {
  const loaded = Route.useLoaderData();
  const { tab: tabId } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/settings" });
  const router = useRouter();
  const { busy, run } = useAction();
  const toast = useToast();
  const [s, setS] = useState<SiteSettings>(() => structuredClone(loaded));
  const [dirty, setDirty] = useState<Set<SettingsKey>>(new Set());
  const [previewKey, setPreviewKey] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];

  useEffect(() => {
    if (dirty.size === 0) setS(structuredClone(loaded));
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty.size) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (key: SettingsKey, field: string, value: unknown) => {
    setS((prev) => ({ ...prev, [key]: { ...(prev[key] as Obj), [field]: value } }));
    setDirty((d) => new Set(d).add(key));
  };

  async function saveAll() {
    const keys = [...dirty];
    for (const key of keys) {
      const r = await run(() => saveSettingsSection({ data: { key, value: s[key] as Obj } }));
      if (!r) return;
    }
    setDirty(new Set());
    await router.invalidate(); // refresh site-wide settings
    setPreviewKey((k) => k + 1);
    toast("Changes saved and live on the website");
  }

  function resetTab() {
    if (!confirm(`Put everything on the "${tab.label}" tab back to the original design? You can review it before saving.`)) return;
    setS((prev) => {
      const next = { ...prev } as Record<SettingsKey, Obj>;
      for (const sec of tab.sections) {
        const defaults = SITE_DEFAULTS[sec.key] as Obj;
        next[sec.key] = { ...next[sec.key], ...Object.fromEntries(sec.fields.map((f) => [f.k, structuredClone(defaults[f.k])])) };
      }
      return next as unknown as SiteSettings;
    });
    setDirty((d) => new Set([...d, ...tab.sections.map((sec) => sec.key)]));
    toast("Original values restored on this tab. Click Save to publish them.");
  }

  function applyPreset(i: number) {
    const p = COLOR_PRESETS[i];
    setS((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...p.theme },
      header: { ...prev.header, ...p.header },
      footer: { ...prev.footer, ...p.footer },
      topBar: { ...prev.topBar, ...p.topBar },
    }));
    setDirty((d) => new Set([...d, "theme", "header", "footer", "topBar"] as SettingsKey[]));
  }

  return (
    <AdminPage
      title="Site settings"
      subtitle="Change how the website looks and what it says. Click Save to publish."
      actions={
        <>
          <Btn variant="ghost" onClick={() => setShowPreview((v) => !v)} className="hidden xl:inline-flex">
            {showPreview ? "Hide preview" : "Show preview"}
          </Btn>
          <Btn onClick={resetTab} disabled={busy}>Reset tab</Btn>
          <Btn variant="primary" onClick={saveAll} disabled={busy || dirty.size === 0}>
            {busy ? "Saving…" : dirty.size ? "Save changes" : "All saved"}
          </Btn>
        </>
      }
    >
      {/* Tabs */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex w-max gap-1 rounded-xl border border-zinc-200 bg-white p-1">
          {TABS.map((t) => {
            const hasDirty = t.sections.some((sec) => dirty.has(sec.key));
            return (
              <button
                key={t.id}
                onClick={() => navigate({ search: { tab: t.id }, replace: true })}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  t.id === tab.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                {t.label}
                {hasDirty && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("grid gap-6", showPreview && "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]")}>
        <div className="space-y-6">
          {tab.id === "colours" && (
            <Card title="Colour presets" description="One click to try a full colour scheme. You can fine-tune after.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COLOR_PRESETS.map((p, i) => (
                  <button key={p.name} onClick={() => applyPreset(i)} className="rounded-lg border border-zinc-200 p-2 text-left hover:border-zinc-500">
                    <div className="flex h-8 overflow-hidden rounded">
                      {[p.theme.background, p.theme.primary, p.theme.accent, p.theme.surface].map((c, j) => (
                        <span key={j} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="mt-1.5 block text-xs font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {tab.sections.map((sec) => (
            <Card key={sec.key + sec.title} title={sec.title} description={sec.description}>
              <div className="grid gap-4 sm:grid-cols-2">
                {sec.fields.map((f) => (
                  <div key={f.k} className={cn((f.wide || f.type === "links" || f.type === "list" || f.type === "image" || f.type === "textarea") && "sm:col-span-2")}>
                    <FieldEditor field={f} value={(s[sec.key] as Obj)[f.k]} onChange={(v) => update(sec.key, f.k, v)} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {showPreview && (
          <div className="hidden xl:block">
            <div className="sticky top-6">
              <Preview path={tab.previewPath} reloadKey={previewKey} dirty={dirty.size > 0} />
            </div>
          </div>
        )}
      </div>

      {dirty.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-60">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">You have unsaved changes.</p>
            <Btn variant="primary" onClick={saveAll} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Btn>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

function Preview({ path, reloadKey, dirty }: { path: string; reloadKey: number; dirty: boolean }) {
  const [p, setP] = useState(path);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => setP(path), [path]);
  const pages = useMemo(
    () => [
      ["/", "Home"],
      ["/about", "About"],
      ["/services", "Services"],
      ["/portfolio", "Portfolio"],
      ["/quote", "Quote"],
      ["/contact", "Contact"],
    ],
    [],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2">
        <select value={p} onChange={(e) => setP(e.target.value)} className="rounded-md border border-zinc-200 px-2 py-1 text-xs">
          {pages.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">{dirty ? "Save to see changes" : "Live preview"}</span>
        <a href={p} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">Open ↗</a>
      </div>
      <div className="relative h-[calc(100vh-10rem)] overflow-hidden bg-zinc-100">
        {/* Rendered at desktop width and scaled down to fit. */}
        <iframe
          ref={frame}
          key={`${p}-${reloadKey}`}
          src={p}
          title="Website preview"
          className="absolute left-0 top-0 h-[250%] w-[250%] origin-top-left scale-[0.4] border-0 bg-white"
        />
      </div>
    </div>
  );
}

function FieldEditor({ field: f, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (f.type) {
    case "text":
      return <TextInput label={f.label} hint={f.hint} value={String(value ?? "")} onChange={onChange} />;
    case "textarea":
      return <TextArea label={f.label} hint={f.hint} rows={3} value={String(value ?? "")} onChange={onChange} />;
    case "color":
      return <ColorInput label={f.label} hint={f.hint} value={String(value ?? "")} onChange={onChange} />;
    case "image":
      return <ImageField label={f.label} hint={f.hint} value={String(value ?? "")} onChange={onChange} />;
    case "toggle":
      return <Toggle label={f.label} hint={f.hint} checked={!!value} onChange={onChange} />;
    case "number":
      return <NumberInput label={f.label} hint={f.hint} value={Number(value ?? 0)} onChange={onChange} min={f.min} max={f.max} step={f.step} unit={f.unit} />;
    case "select":
      return <SelectInput label={f.label} hint={f.hint} value={String(value ?? "")} onChange={onChange} options={f.options} />;
    case "font": {
      const v = String(value ?? "");
      const custom = !FONT_OPTIONS.includes(v);
      return (
        <Label label={f.label} hint={f.hint ?? "Any font from fonts.google.com works. Type its exact name."}>
          <input
            list="font-options"
            value={v}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            style={{ fontFamily: custom ? undefined : `"${v}"` }}
          />
          <datalist id="font-options">
            {FONT_OPTIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Label>
      );
    }
    case "link": {
      const l = (value as { label: string; to: string }) ?? { label: "", to: "" };
      return (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{f.label}</span>
          <div className="grid grid-cols-2 gap-2">
            <input value={l.label} placeholder="Button text" onChange={(e) => onChange({ ...l, label: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            <input value={l.to} placeholder="/quote" onChange={(e) => onChange({ ...l, to: e.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs outline-none focus:border-zinc-900" />
          </div>
          <span className="mt-1 block text-xs text-zinc-500">Leave the text empty to hide the button.</span>
        </div>
      );
    }
    case "links": {
      const items = (Array.isArray(value) ? value : []) as { label: string; to: string }[];
      const setItem = (i: number, patch: Partial<{ label: string; to: string }>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
      const move = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= items.length) return;
        const n = [...items];
        [n[i], n[j]] = [n[j], n[i]];
        onChange(n);
      };
      return (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{f.label}</span>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col text-[0.6rem] leading-none text-zinc-400">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 py-0.5 hover:text-zinc-900 disabled:opacity-30" aria-label="Move up">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="px-1 py-0.5 hover:text-zinc-900 disabled:opacity-30" aria-label="Move down">▼</button>
                </div>
                <input value={it.label} placeholder="Label" onChange={(e) => setItem(i, { label: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <input value={it.to} placeholder="/page" onChange={(e) => setItem(i, { to: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs outline-none focus:border-zinc-900" />
                <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50" aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
          <Btn size="sm" className="mt-2" onClick={() => onChange([...items, { label: "", to: "/" }])}>+ Add link</Btn>
          {f.hint && <span className="mt-2 block text-xs text-zinc-500">{f.hint}</span>}
        </div>
      );
    }
    case "list": {
      const items = (Array.isArray(value) ? value : []) as Obj[];
      const setItem = (i: number, k: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
      return (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{f.label}</span>
          {f.hint && <span className="mb-2 block text-xs text-zinc-500">{f.hint}</span>}
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2 rounded-lg border border-zinc-200 p-2">
                <span className="pt-2 text-xs font-semibold text-zinc-400">{i + 1}</span>
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  {f.itemFields.map((itf) =>
                    itf.type === "textarea" ? (
                      <textarea key={itf.k} rows={2} placeholder={itf.label} value={String(it[itf.k] ?? "")} onChange={(e) => setItem(i, itf.k, e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 sm:col-span-2" />
                    ) : (
                      <input key={itf.k} placeholder={itf.label} value={String(it[itf.k] ?? "")} onChange={(e) => setItem(i, itf.k, e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                    ),
                  )}
                </div>
                <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="self-start rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50" aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
          <Btn size="sm" className="mt-2" onClick={() => onChange([...items, Object.fromEntries(f.itemFields.map((x) => [x.k, ""]))])}>
            + Add {f.itemLabel.toLowerCase()}
          </Btn>
        </div>
      );
    }
  }
}
