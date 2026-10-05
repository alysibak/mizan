import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/calculator", priority: 0.9, changeFrequency: "monthly" },
  { path: "/method", priority: 0.6, changeFrequency: "monthly" },
  { path: "/trust", priority: 0.6, changeFrequency: "monthly" },
  { path: "/register", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

// Read at request time, so a self-hosted image picks up its own APP_URL,
// OPERATOR_NAME, and CONTACT_EMAIL without a rebuild.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PAGES.map((p) => ({
    url: new URL(p.path, base).toString(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
