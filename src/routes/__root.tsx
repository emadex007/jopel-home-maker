/// <reference types="vite/client" />
import type { ReactNode } from "react";
import { HeadContent, Link, Outlet, Scripts, createRootRoute, useRouterState } from "@tanstack/react-router";
import appCss from "~/styles.css?url";
import { getServices, getSite } from "~/lib/api";
import { SITE_DEFAULTS } from "~/lib/site-defaults";
import { SiteContext, googleFontsHrefs, img } from "~/lib/ui";
import { ThemeStyle } from "~/components/ThemeStyle";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { WhatsAppButton } from "~/components/WhatsAppButton";

export const Route = createRootRoute({
  loader: async () => {
    const [settings, services] = await Promise.all([getSite(), getServices().catch(() => [])]);
    return { settings, services: services.map((s) => ({ slug: s.slug, title: s.title })) };
  },
  // Settings rarely change; avoid refetching them on every page change.
  staleTime: 5 * 60_000,
  head: ({ loaderData }) => {
    const s = loaderData?.settings ?? SITE_DEFAULTS;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: s.seo.title },
        { name: "description", content: s.seo.description },
        { name: "theme-color", content: s.theme.primary },
        { property: "og:site_name", content: s.brand.name },
        { property: "og:title", content: s.seo.title },
        { property: "og:description", content: s.seo.description },
        { property: "og:type", content: "website" },
        ...(s.seo.ogImage ? [{ property: "og:image", content: img(s.seo.ogImage, 1200) }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        ...googleFontsHrefs([s.theme.headingFont, s.theme.bodyFont]).map((href) => ({ rel: "stylesheet", href })),
        { rel: "stylesheet", href: appCss },
        ...(s.brand.faviconUrl ? [{ rel: "icon", href: s.brand.faviconUrl }] : []),
      ],
    };
  },
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const { settings, services } = Route.useLoaderData();
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  // The admin dashboard has its own layout (src/routes/admin.tsx).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (
      <SiteContext.Provider value={settings}>
        <ThemeStyle s={settings} />
        <Outlet />
      </SiteContext.Provider>
    );
  }

  return (
    <SiteContext.Provider value={settings}>
      <ThemeStyle s={settings} />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer services={services} />
      </div>
      <WhatsAppButton />
    </SiteContext.Provider>
  );
}

function NotFound() {
  return (
    <section className="container-x section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="text-5xl md:text-6xl">This page doesn't exist</h1>
      <p className="mt-4 max-w-md text-muted">The page may have moved. Take a look at our work or get in touch.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/portfolio" className="btn btn-primary">View Portfolio</Link>
        <Link to="/" className="btn btn-outline">Go Home</Link>
      </div>
    </section>
  );
}
