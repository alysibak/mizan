"use client";

import Link from "next/link";
import { useHydrated, useStoredValues } from "@/lib/client-store";
import { decimalMarkFor } from "@/lib/calculator";
import { formatMoney } from "@/lib/money";
import { PHONE_KEYS, phoneLines } from "@/lib/phone-features";
import { PAGE_ICONS } from "@/components/pageIcons";
import { IconQuestion } from "@/components/icons";

/** The rest of Mizan, each a tap away, for anyone who has not used it yet. */
const MORE = [
  { key: "fitr", icon: "fitr", title: "Zakat al-Fitr", status: "For each person, before the Eid prayer", href: "/zakat-al-fitr" },
  { key: "missed", icon: "missed", title: "Years I did not pay", status: "Add them up, and pay a little each month", href: "/missed-years" },
  { key: "who", icon: "who", title: "Who can receive zakat", status: "Your aunt, a neighbour, the mosque?", href: "/who-can-receive" },
  { key: "interest", icon: "interest", title: "Interest from a bank", status: "Set it aside and give it away", href: "/interest" },
  { key: "fasts", icon: "fasts", title: "Fasts I missed", status: "Make them up, or give instead", href: "/fasts" },
  { key: "ask", icon: "ask", title: "Ask a question", status: "Every answer, with where it comes from", href: "/ask" },
];

/**
 * Signed in, the rest of Mizan is still here: what the phone's tools are
 * keeping (from the one registry, with where each stands), then the tools
 * not used yet. Nothing here asks for anything to be typed.
 */
export default function EverythingElse({ currency }: { currency: string }) {
  const hydrated = useHydrated();
  const phone = useStoredValues(PHONE_KEYS);
  const intl = hydrated ? navigator.language : "en";
  const ctx = {
    today: new Date(),
    money: (n: number) => formatMoney(n, currency, intl),
    decimal: decimalMarkFor(intl),
    intl,
  };
  const kept = hydrated ? phoneLines(phone, ctx) : [];
  const keptPaths = new Set(kept.map((l) => l.href));
  const rows = [
    ...kept.map((l) => ({ ...l, kept: true })),
    ...MORE.filter((m) => !keptPaths.has(m.href) && !kept.some((l) => l.key === m.key)).map((m) => ({ ...m, kept: false })),
  ];

  return (
    <section aria-labelledby="else-title">
      <h2 id="else-title" className="font-serif text-xl text-ink">
        Everything else
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(({ key, icon, title, status, href, kept: isKept }) => {
          const Icon = PAGE_ICONS[icon] ?? IconQuestion;
          return (
            <li key={key}>
              <Link
                href={href}
                className={
                  "group flex h-full items-center gap-3 border px-4 py-3 transition hover:border-pine " +
                  (isKept ? "border-pine/40 bg-pine/5" : "border-mist bg-surface")
                }
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-ink">{title}</span>
                  <span className="block text-sm text-sage nums">{status}</span>
                </span>
                <span className="text-pine transition group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
