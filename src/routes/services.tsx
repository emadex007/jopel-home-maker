import { createFileRoute, Link } from "@tanstack/react-router";
import { getServices } from "~/lib/api";
import { cn, img, useSite } from "~/lib/ui";
import { PageHero } from "~/components/ui";
import { ArrowRight } from "~/components/Icons";

export const Route = createFileRoute("/services")({
  loader: () => getServices(),
  head: () => ({ meta: [{ title: "Services | Jo-pearl Home Maker" }] }),
  component: Services,
});

function Services() {
  const s = useSite();
  const services = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="What we do" title={s.pages.servicesTitle} intro={s.pages.servicesIntro} image={s.pages.servicesImage} />
      <section className="section">
        <div className="container-x flex flex-col gap-20 md:gap-28">
          {services.map((sv, i) => (
            <article key={sv.id} id={sv.slug} className="grid scroll-mt-[calc(var(--header-h)+2rem)] items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn("img-zoom aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-line", i % 2 === 1 && "lg:order-2")}>
                {sv.image && <img src={img(sv.image, 1200)} alt={sv.title} loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div>
                <span className="font-heading text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-3 text-4xl md:text-5xl">{sv.title}</h2>
                <p className="mt-4 font-heading text-xl italic text-muted">{sv.summary}</p>
                <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">{sv.description}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/quote" search={{ service: sv.title }} className="btn btn-primary">
                    Get a Quote <ArrowRight size={16} />
                  </Link>
                  <Link to="/book" search={{ service: sv.title }} className="btn btn-outline">
                    Book a Consultation
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
