import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProject } from "~/lib/api";
import { cn, img, useSite, waLink } from "~/lib/ui";
import { Lightbox } from "~/components/ui";
import { ArrowLeft, ArrowRight, ImagesIcon, WhatsAppIcon } from "~/components/Icons";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: async ({ params }) => {
    const data = await getProject({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.project.title} | Jo-pearl Home Maker` },
            { name: "description", content: loaderData.project.summary },
            { property: "og:title", content: loaderData.project.title },
            { property: "og:description", content: loaderData.project.summary },
            { property: "og:image", content: img(loaderData.project.cover_image, 1200) },
          ],
        }
      : {},
  component: ProjectPage,
});

function ProjectPage() {
  const s = useSite();
  const { project: p, prev, next } = Route.useLoaderData();
  const [open, setOpen] = useState<number | null>(null);
  const photos = p.photos;
  const details = [
    ["Category", p.category],
    ["Location", p.location],
    ["Year", p.year],
    ["Duration", p.duration],
  ].filter(([, v]) => v);

  return (
    <>
      {/* Cover */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-primary text-white">
        <img src={img(p.cover_image, 2400)} alt={p.title} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="container-x relative pb-12 pt-32 md:pb-16">
          <Link to="/portfolio" className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft size={16} /> All projects
          </Link>
          <p className="eyebrow fade-up mb-3 !text-[color-mix(in_srgb,var(--c-accent)_60%,white)]">{p.category}</p>
          <h1 className="fade-up max-w-4xl text-5xl md:text-7xl">{p.title}</h1>
          {p.summary && <p className="fade-up-2 mt-5 max-w-2xl text-white/85 md:text-lg">{p.summary}</p>}
          {photos.length > 1 && (
            <button onClick={() => setOpen(0)} className="btn btn-outline fade-up-3 mt-8 text-white">
              <ImagesIcon size={18} /> View all {photos.length} photos
            </button>
          )}
        </div>
      </section>

      {/* Details */}
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <dl className="divide-y divide-line border-y border-line">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-4 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
              {p.scope && (
                <div className="py-4 text-sm">
                  <dt className="mb-2 text-muted">Scope of work</dt>
                  <dd className="font-medium leading-relaxed">{p.scope}</dd>
                </div>
              )}
            </dl>
            <div className="mt-8 flex flex-col gap-3">
              <Link to="/quote" className="btn btn-primary">Get a quote for a similar project</Link>
              {s.contact.whatsapp && (
                <a
                  href={waLink(s.contact.whatsapp, `Hello ${s.brand.name}, I saw the "${p.title}" project on your website and I'd like something similar.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <WhatsAppIcon /> Ask about this project
                </a>
              )}
            </div>
          </aside>
          <div className="lg:col-span-8">
            <p className="eyebrow mb-4">About the project</p>
            <div className="prose-site max-w-none space-y-4 text-lg leading-relaxed">
              {(p.description || p.summary)
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i} className={cn(i === 0 && "font-heading text-2xl leading-snug md:text-3xl")}>
                    {para}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {photos.length > 0 && (
        <section className="pb-[var(--section-y)]">
          <div className="container-x">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-4xl">Gallery</h2>
              <p className="text-sm text-muted">{photos.length} photo{photos.length === 1 ? "" : "s"} · tap to enlarge</p>
            </div>
            <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[280px] md:grid-cols-4 md:gap-4">
              {photos.map((ph, i) => (
                <button
                  key={ph.id + ph.url}
                  onClick={() => setOpen(i)}
                  className={cn(
                    "img-zoom group relative overflow-hidden rounded-[var(--radius)] bg-line",
                    // A varied, magazine-style layout that repeats every 6 photos.
                    i % 6 === 0 && "col-span-2 row-span-2",
                    i % 6 === 3 && "md:col-span-2",
                  )}
                  aria-label={`Open photo ${i + 1}`}
                >
                  <img src={img(ph.url, i % 6 === 0 ? 1600 : 900)} alt={ph.caption || `${p.title} photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                  {ph.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs text-white">{ph.caption}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prev / next */}
      {(prev || next) && (
        <nav className="border-t border-line" aria-label="More projects">
          <div className="container-x grid sm:grid-cols-2">
            {prev ? (
              <Link to="/portfolio/$slug" params={{ slug: prev.slug }} className="group flex items-center gap-5 py-10 sm:pr-8">
                <ArrowLeft size={22} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                <span className="h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-line">
                  <img src={img(prev.cover_image, 240)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-muted">Previous</span>
                  <span className="font-heading text-2xl">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to="/portfolio/$slug" params={{ slug: next.slug }} className="group flex items-center justify-end gap-5 border-t border-line py-10 text-right sm:border-l sm:border-t-0 sm:pl-8">
                <span>
                  <span className="block text-xs uppercase tracking-wider text-muted">Next</span>
                  <span className="font-heading text-2xl">{next.title}</span>
                </span>
                <span className="h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-line">
                  <img src={img(next.cover_image, 240)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
                <ArrowRight size={22} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </nav>
      )}

      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} title={p.title} />}
    </>
  );
}
