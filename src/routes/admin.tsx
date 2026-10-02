import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, createFileRoute, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { getMe, logout } from "~/lib/admin-api";
import { cn, useSite } from "~/lib/ui";
import { ToastProvider } from "~/components/admin/kit";
import { CloseIcon, MenuIcon } from "~/components/Icons";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const me = await getMe();
    if (!me) throw redirect({ to: "/admin/login", search: { next: location.pathname } });
    return { me };
  },
  head: () => ({ meta: [{ title: "Dashboard | Jo-pearl Home Maker" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const I = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const NAV: { to: string; label: string; icon: string; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z", exact: true },
  { to: "/admin/inbox", label: "Inbox", icon: "M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5" },
  { to: "/admin/projects", label: "Projects", icon: "M3 7h6l2 2h10v10H3zM3 7V5h6" },
  { to: "/admin/services", label: "Services", icon: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" },
  { to: "/admin/testimonials", label: "Testimonials", icon: "M7 8h10M7 12h6M5 4h14a1 1 0 011 1v11a1 1 0 01-1 1h-6l-5 4v-4H5a1 1 0 01-1-1V5a1 1 0 011-1z" },
  { to: "/admin/settings", label: "Site settings", icon: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" },
  { to: "/admin/staff", label: "Staff & account", icon: "M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 10a3 3 0 100-6 3 3 0 000 6zM22 19v-1a4 4 0 00-3-3.9M16 4.1a3 3 0 010 5.8" },
];

function AdminLayout() {
  const s = useSite();
  const { me } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to || pathname === to + "/" : pathname.startsWith(to));

  async function doLogout() {
    await logout();
    await router.invalidate();
    router.navigate({ to: "/admin/login" });
  }

  const sidebar: ReactNode = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link to="/admin" className="block">
          <span className="block font-sans text-base font-semibold text-white">{s.brand.name}</span>
          <span className="block text-xs text-zinc-400">Admin dashboard</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to as "/admin"}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive(n.to, n.exact) ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <I d={n.icon} /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
          <I d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /> View website
        </a>
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
          <I d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3" /> Log out
        </button>
        <p className="truncate px-3 pt-2 text-xs text-zinc-500">
          {me.name} · <span className="capitalize">{me.role}</span>
        </p>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 [font-family:ui-sans-serif,system-ui,sans-serif]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-zinc-900 lg:block">{sidebar}</aside>

        {/* Mobile top bar + drawer */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-zinc-900 px-4 py-3 text-white lg:hidden">
          <span className="truncate text-sm font-semibold">{s.brand.name}</span>
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1">
            <MenuIcon size={24} />
          </button>
        </div>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 bg-zinc-900">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 p-1 text-zinc-400">
                <CloseIcon size={22} />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="lg:pl-60">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
