import { createFileRoute, Link } from "@tanstack/react-router";
import { img, useSite } from "~/lib/ui";
import { PageHero } from "~/components/ui";
import { pageTitle } from "~/lib/brand";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: pageTitle("About Us") }] }),
  component: About,
});

function About() {
  const s = useSite();
  const a = s.about;
  return (
    <>
      <PageHero eyebrow="Who we are" title={a.title} intro={a.intro} image={a.heroImage} />

      <section className="section">
        <div className="container-x grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow mb-5">Our story</p>
            <h2 className="text-4xl md:text-5xl">{s.brand.tagline || "Experience the difference"}</h2>
            <div className="prose-site mt-6 leading-relaxed text-muted">
              {a.story.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/portfolio" className="btn btn-primary">See Our Work</Link>
              <Link to="/contact" className="btn btn-outline">Get in Touch</Link>
            </div>
          </div>
          {a.image && (
            <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius)] bg-line">
              <img src={img(a.image, 1200)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      {a.values.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x">
            <div className="mb-12 max-w-2xl">
              <p className="eyebrow mb-4">What we stand for</p>
              <h2 className="text-4xl md:text-5xl">Our values</h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {a.values.map((v, i) => (
                <div key={v.title} className="border-t border-line pt-6">
                  <span className="font-heading text-4xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-2xl">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
