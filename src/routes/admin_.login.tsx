import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { getAuthState, login, setupOwner } from "~/lib/admin-api";
import { useSite } from "~/lib/ui";

type Search = { next?: string };

export const Route = createFileRoute("/admin_/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    next: typeof s.next === "string" && s.next.startsWith("/admin") ? s.next : undefined,
  }),
  loader: async () => {
    const state = await getAuthState();
    if (state.me) throw redirect({ to: "/admin" });
    return state;
  },
  head: () => ({ meta: [{ title: "Log in | Jo-pearl Home Maker" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LoginPage,
});

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

function LoginPage() {
  const s = useSite();
  const { needsSetup, setupCodeConfigured } = Route.useLoaderData();
  const { next } = Route.useSearch();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = needsSetup ? await setupOwner({ data: f }) : await login({ data: { email: f.email, password: f.password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await router.invalidate();
      router.navigate({ to: (next as "/admin") || "/admin" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 [font-family:ui-sans-serif,system-ui,sans-serif]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-heading text-3xl text-zinc-900">{s.brand.name}</p>
          <p className="mt-1 text-sm text-zinc-500">{needsSetup ? "Create the owner account" : "Staff login"}</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {needsSetup && (
            <>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                First-time setup. {setupCodeConfigured ? "Enter the setup code you saved as ADMIN_SETUP_CODE." : "ADMIN_SETUP_CODE isn't set yet. Add it first (see README), then reload this page."}
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Setup code</span>
                <input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} autoComplete="off" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Your name</span>
                <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required />
              </label>
            </>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Email</span>
            <input className={inputCls} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Password</span>
            <input
              className={inputCls}
              type="password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              autoComplete={needsSetup ? "new-password" : "current-password"}
              minLength={needsSetup ? 8 : undefined}
              required
            />
            {needsSetup && <span className="mt-1 block text-xs text-zinc-500">At least 8 characters.</span>}
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60">
            {busy ? "Please wait…" : needsSetup ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-500">
          <a href="/" className="hover:text-zinc-800">← Back to website</a>
        </p>
      </div>
    </div>
  );
}
