import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getPortfolio } from "~/lib/api";
import { cn, useSite } from "~/lib/ui";
import { PageHero, ProjectCard } from "~/components/ui";
import { pageTitle } from "~/lib/brand";

export const Route = createFileRoute("/portfolio/")({
  loader: () => getPortfolio(),
  head: () => ({ meta: [{ title: pageTitle("Portfolio") }] }),
  component: Portfolio,
});

function Portfolio() {
  const s = useSite();
  const projects = Route.useLoaderData();
  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category).filter(Boolean))], [projects]);
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? projects : projects.filter((p) => p.category === cat);

  return (
    <>
      <PageHero eyebrow="Our work" title={s.pages.portfolioTitle} intro={s.pages.portfolioIntro} image={s.pages.portfolioImage} />
      <section className="section">
        <div className="container-x">
          {categories.length > 2 && (
            <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects">
              {categories.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  data-on={cat === c}
                  onClick={() => setCat(c)}
                  className="chip"
                >
                  {c}
                  {c !== "All" && <span className="ml-1.5 opacity-60">{projects.filter((p) => p.category === c).length}</span>}
                </button>
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <p className="py-20 text-center text-muted">Projects will appear here soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p, i) => (
                <div key={p.id} className={cn(i % 5 === 0 && shown.length > 4 && "lg:col-span-2")}>
                  <ProjectCard p={p} large={i % 5 === 0 && shown.length > 4} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 flex flex-col items-center gap-5 border-t border-line pt-16 text-center">
            <h2 className="text-4xl">Like what you see?</h2>
            <p className="max-w-md text-muted">Let's talk about your space. Book a consultation or tell us about your project for a quote.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/quote" className="btn btn-primary">Request a Quote</Link>
              <Link to="/book" className="btn btn-outline">Book a Consultation</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
