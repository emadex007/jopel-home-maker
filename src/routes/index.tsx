import { createFileRoute, Link } from "@tanstack/react-router";
import { getHomeData } from "~/lib/api";
import { cn, img, useSite } from "~/lib/ui";
import { SiteLink } from "~/components/SiteLink";
import { ProjectCard, SectionHeading } from "~/components/ui";
import { ArrowRight } from "~/components/Icons";

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  component: Home,
});

function Home() {
  const s = useSite();
  const { services, projects, testimonials } = Route.useLoaderData();
  const h = s.hero;
  const home = s.home;
  const center = h.align === "center";
  const overlay = Math.min(0.9, Math.max(0, Number(h.overlay) || 0));

  return (
    <>
      {/* HERO */}
      <section
        className="relative flex items-center overflow-hidden bg-primary text-white"
        style={{ minHeight: `max(560px, ${Math.min(100, Math.max(40, Number(h.height) || 90))}vh)` }}
      >
        {h.image && <img src={img(h.image, 2400)} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />}
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <div className={cn("container-x relative pb-20 pt-[calc(var(--header-h)+3rem)]", center && "text-center")}>
          {h.eyebrow && <p className="eyebrow fade-up mb-6 !text-[color-mix(in_srgb,var(--c-accent)_60%,white)]">{h.eyebrow}</p>}
          <h1 className={cn("fade-up max-w-4xl text-5xl leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl", center && "mx-auto")}>{h.title}</h1>
          {h.subtitle && (
            <p className={cn("fade-up-2 mt-7 max-w-xl text-base leading-relaxed text-white/85 md:text-lg", center && "mx-auto")}>{h.subtitle}</p>
          )}
          <div className={cn("fade-up-3 mt-10 flex flex-wrap gap-3", center && "justify-center")}>
            {h.primaryCta.label && (
              <SiteLink to={h.primaryCta.to} className="btn btn-accent">
                {h.primaryCta.label} <ArrowRight size={16} />
              </SiteLink>
            )}
            {h.secondaryCta.label && (
              <SiteLink to={h.secondaryCta.to} className="btn btn-outline text-white">
                {h.secondaryCta.label}
              </SiteLink>
            )}
          </div>
          {s.brand.tagline && (
            <p className={cn("fade-up-3 mt-16 font-heading text-xl italic text-white/70 md:text-2xl", center && "mx-auto")}>{s.brand.tagline}</p>
          )}
        </div>
      </section>

      {/* INTRO */}
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius)] bg-line">
              {home.introImage && <img src={img(home.introImage, 1200)} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="absolute -bottom-6 -right-4 hidden h-40 w-40 border border-accent md:block lg:-right-8" aria-hidden />
          </div>
          <div>
            {home.introEyebrow && <p className="eyebrow mb-5">{home.introEyebrow}</p>}
            <h2 className="text-4xl md:text-5xl">{home.introTitle}</h2>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{home.introText}</p>
            {home.stats.length > 0 && (
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
                {home.stats.map((st) => (
                  <div key={st.label}>
                    <dt className="font-heading text-4xl text-accent md:text-5xl">{st.value}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{st.label}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/about" className="btn btn-primary">About Us</Link>
              <Link to="/book" className="btn btn-outline">Book a Consultation</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      {home.showServices && services.length > 0 && (
        <section className="section bg-surface">
          <div className="container-x">
            <SectionHeading
              eyebrow="What we do"
              title="Our Services"
              text={s.pages.servicesIntro}
              action={<Link to="/services" className="btn btn-outline shrink-0">All Services <ArrowRight size={16} /></Link>}
            />
            <div className="grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {services.map((sv, i) => (
                <Link key={sv.id} to="/services" hash={sv.slug} className="group flex flex-col bg-surface p-8 transition-colors hover:bg-bg">
                  <span className="font-heading text-lg text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-6 text-3xl">{sv.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{sv.summary}</p>
                  <span className="mt-6 flex items-center gap-2 text-sm font-semibold opacity-60 transition-opacity group-hover:opacity-100">
                    Learn more <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROJECTS */}
      {home.showProjects && projects.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading
              eyebrow="Portfolio"
              title="Recent Projects"
              text="Every project has its own story. Click any project to see the full gallery."
              action={<Link to="/portfolio" className="btn btn-outline shrink-0">View All Projects <ArrowRight size={16} /></Link>}
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROCESS */}
      {home.showProcess && home.process.length > 0 && (
        <section className="section bg-primary text-on-primary">
          <div className="container-x">
            <div className="mb-14 max-w-2xl">
              <p className="eyebrow mb-4">How we work</p>
              <h2 className="text-4xl md:text-5xl">A simple process, from idea to handover</h2>
            </div>
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {home.process.map((step, i) => (
                <li key={step.title} className="border-t border-white/20 pt-6">
                  <span className="font-heading text-5xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-4 text-2xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* TESTIMONIALS (hidden until real ones are added in the dashboard) */}
      {home.showTestimonials && testimonials.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Kind words" title="What our clients say" align="center" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="flex flex-col rounded-[var(--radius)] border border-line bg-surface p-8">
                  <span className="font-heading text-6xl leading-none text-accent" aria-hidden>
                    “
                  </span>
                  <blockquote className="mt-2 flex-1 font-heading text-xl leading-snug">{t.quote}</blockquote>
                  <figcaption className="mt-6 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    {t.role && <span className="block text-muted">{t.role}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {home.showCta && (
        <section className="relative overflow-hidden bg-primary text-white">
          {home.ctaImage && <img src={img(home.ctaImage, 2200)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-black/60" />
          <div className="container-x section relative text-center">
            <h2 className="mx-auto max-w-3xl text-4xl md:text-6xl">{home.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-xl text-white/80">{home.ctaText}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/quote" className="btn btn-accent">Request a Quote</Link>
              <Link to="/book" className="btn btn-outline text-white">Book a Consultation</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
