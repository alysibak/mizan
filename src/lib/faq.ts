// Plain answers to the questions people search for, shown on the public pages
// and published as FAQ structured data. Hedged where scholars differ.

export interface Faq {
  q: string;
  a: string;
}

export const ZAKAT_FAQ: Faq[] = [
  {
    q: "What is nisab?",
    a: "Nisab is the least amount of wealth on which zakat is due. It is set by weight of precious metal: 85 grams of gold or 595 grams of silver. Its value in money moves with the metal price, so it is worked out on the day you reckon.",
  },
  {
    q: "Should I use the gold or the silver nisab?",
    a: "Both are prophetic standards, but today they are far apart in value. Many contemporary scholars and zakat bodies recommend the silver standard for cash and mixed wealth because it is lower, so more people give and more reaches those in need. Others use gold. Mizan shows both and lets you choose.",
  },
  {
    q: "What is the hawl?",
    a: "The hawl is one lunar (Hijri) year, about 354 days. Zakat is due on wealth that has stayed at or above nisab for a full hawl. Many people pick a fixed day, such as a date in Ramadan, and reckon everything they hold on that day each year.",
  },
  {
    q: "What do I pay zakat on?",
    a: "Cash, bank balances, gold and silver, shares and funds, cryptocurrency, business stock for sale, and money owed to you that you expect back. Your home, car, clothes, furniture, and other things for personal use are not counted.",
  },
  {
    q: "Is jewellery zakatable?",
    a: "Schools differ. The Hanafi school counts gold and silver jewellery, including pieces worn. The Maliki, Shafi‘i, and Hanbali schools generally exempt jewellery kept for personal adornment. Jewellery held as an investment is counted by all.",
  },
  {
    q: "How are shares and pensions treated?",
    a: "Shares bought to sell on are counted at full market value. For long-term holdings, a common modern method counts only the company’s zakatable assets per share, often estimated at around a quarter of the share price. Pensions depend on whether you can access the money; ask someone you trust.",
  },
  {
    q: "Can I deduct my debts?",
    a: "Debts due now, such as bills, credit card balances, and loan instalments that have fallen due, are commonly deducted. For long-term debts like a mortgage, many contemporary scholars deduct only what is due in the coming year, not the whole balance.",
  },
  {
    q: "Why is the rate 2.577% on a solar year?",
    a: "Zakat is 2.5% for each lunar year. A solar year is about eleven days longer, so if you reckon on a Gregorian date the rate is scaled by 365.25 / 354.367, about 2.577%, to stay fair over time.",
  },
  {
    q: "Is what I type saved or sent anywhere?",
    a: "The calculator runs in your browser. Your figures stay in this browser’s storage so a refresh does not lose them, and you can clear them at any time. The only thing sent to Mizan is your currency code, to look up today’s metal prices.",
  },
];

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
