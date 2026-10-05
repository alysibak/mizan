import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

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
