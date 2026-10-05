// FAQ structured data for search engines. The questions themselves live in
// each language's messages (src/i18n/messages).

export interface Faq {
  q: string;
  a: string;
}

export function faqJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
