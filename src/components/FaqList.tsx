import { useState } from "react";
import { cn } from "~/lib/ui";
import type { Faq } from "~/server/db";

/** Accordion of questions, plus FAQPage structured data so Google can show them in search results. */
export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(items[0]?.id ?? null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id}>
            <h3>
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-${f.id}`}
                className="flex w-full items-center justify-between gap-6 py-5 text-left font-heading text-xl md:text-2xl"
              >
                {f.question}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-lg transition-transform duration-300",
                    isOpen && "rotate-45 border-accent text-accent",
                  )}
                  aria-hidden
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={`faq-${f.id}`}
              className={cn("grid transition-[grid-template-rows] duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <p className="whitespace-pre-line pb-6 pr-12 leading-relaxed text-muted">{f.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
