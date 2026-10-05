import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Read at request time, so a self-hosted image picks up its own APP_URL,
// OPERATOR_NAME, and CONTACT_EMAIL without a rebuild.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/calculator", "/method", "/trust", "/privacy", "/terms"],
        // Private ledgers and the API are never search results.
        disallow: ["/api/", "/dashboard", "/assets", "/year", "/giving", "/tools", "/settings", "/admin", "/begin", "/zakat", "/statement", "/screening", "/mirath"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
