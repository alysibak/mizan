import type { MetadataRoute } from "next";
import { LOCALES, languageAlternates, localePath } from "@/i18n/config";
import { CALC_CURRENCIES } from "@/lib/calculator";
import { siteUrl } from "@/lib/site";

// Read at request time, so a self-hosted image picks up its own APP_URL.
export const dynamic = "force-dynamic";

type Freq = "hourly" | "weekly" | "monthly" | "yearly";

/** Pages that exist in every language, with hreflang links between them. */
const TRANSLATED: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/calculator", priority: 0.9, changeFrequency: "monthly" },
  { path: "/nisab", priority: 0.8, changeFrequency: "hourly" },
  ...CALC_CURRENCIES.map((c) => ({
    path: `/nisab/${c.toLowerCase()}`,
    priority: 0.6,
    changeFrequency: "hourly" as const,
  })),
];

/** English-only pages. */
const ENGLISH: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: "/method", priority: 0.6, changeFrequency: "monthly" },
  { path: "/trust", priority: 0.6, changeFrequency: "monthly" },
  { path: "/register", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const abs = (p: string) => new URL(p, base).toString();
  const out: MetadataRoute.Sitemap = [];
  for (const page of TRANSLATED) {
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(page.path)).map(([l, p]) => [l, abs(p)]),
    );
    for (const locale of LOCALES) {
      out.push({
        url: abs(localePath(locale, page.path)),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages },
      });
    }
  }
  for (const page of ENGLISH) {
    out.push({ url: abs(page.path), changeFrequency: page.changeFrequency, priority: page.priority });
  }
  return out;
}
