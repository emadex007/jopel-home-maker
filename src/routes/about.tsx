import { createFileRoute, Link } from "@tanstack/react-router";
import { img, useSite } from "~/lib/ui";
import { PageHero } from "~/components/ui";
import { CountUp } from "~/components/CountUp";
import { pageTitle } from "~/lib/brand";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: pageTitle("About Us") }] }),
  component: About,
});

const paras = (t: string) => (t || "").split(/\n{2,}/).filter(Boolean);

function About() {
  const s = useSite();
  const a = s.about;
  const stats = (a.stats ?? []).filter((x) => x.value);

  return (
    <>
      <PageHero eyebrow="Who we are" title={a.title} intro={a.intro} image={a.heroImage} />

      {/* 1. COMPANY PROFILE + COUNTING NUMBERS */}
      {(a.profileText || stats.length > 0) && (
        <section className="section">
          <div className="container-x">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                {a.profileEyebrow && <p className="eyebrow mb-5">{a.profileEyebrow}</p>}
                <h2 className="text-4xl md:text-5xl">{a.profileTitle || s.brand.name}</h2>
                {a.establishedYear ? <p className="mt-4 font-heading text-xl italic text-accent">...since {a.establishedYear}</p> : null}
              </div>
              <div className="prose-site text-lg leading-relaxed text-muted lg:col-span-7">
                {paras(a.profileText).map((p, i) => (
                  <p key={i} className={i === 0 ? "text-ink" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {stats.length > 0 && (
              <dl className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-3">
                {stats.map((st) => (
                  <div key={st.label} className="bg-surface px-6 py-10 text-center">
                    <dt className="sr-only">{st.label}</dt>
                    <dd>
                      <span className="block font-heading text-6xl text-accent md:text-7xl">
                        <CountUp value={st.value} establishedYear={a.establishedYear} />
                      </span>
                      <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">{st.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      )}

      {/* 2. SLOGAN */}
      {a.slogan && (
        <section className="relative overflow-hidden bg-primary text-on-primary">
          {a.image && <img src={img(a.image, 2000)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-15" />}
          <div className="container-x section relative text-center">
            {a.sloganEyebrow && <p className="eyebrow mb-6 !text-[color-mix(in_srgb,var(--c-accent)_60%,white)]">{a.sloganEyebrow}</p>}
            <p className="mx-auto max-w-4xl font-heading text-5xl italic leading-tight md:text-7xl">{a.slogan}</p>
            {a.sloganText && <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed opacity-85">{a.sloganText}</p>}
            {a.sloganPromise && (
              <p className="mx-auto mt-10 max-w-2xl border-t border-white/15 pt-8 font-heading text-2xl leading-snug md:text-3xl">{a.sloganPromise}</p>
            )}
          </div>
        </section>
      )}

      {/* 3. STORY */}
      <section className="section">
        <div className="container-x grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow mb-5">Our story</p>
            <h2 className="text-4xl md:text-5xl">Designed and executed with care</h2>
            <div className="prose-site mt-6 leading-relaxed text-muted">
              {paras(a.story).map((para, i) => (
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

      {/* 4. VALUES */}
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
