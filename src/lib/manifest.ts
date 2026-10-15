import type { MetadataRoute } from "next";
import { LOCALE_INFO, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

const ICON = [{ src: "/icons/icon-192.png", sizes: "192x192" }];

/**
 * The home-screen app, in one language. Someone who adds Mizan from an Urdu
 * page gets an app that opens in Urdu, with its shortcuts named in Urdu. It
 * opens on the home page: signed-in visitors are sent on to their ledger
 * from there, and everyone else starts where a beginner should.
 */
export function appManifest(locale: Locale): MetadataRoute.Manifest {
  const m = messagesFor(locale);
  const to = (path: string) => localePath(locale, path);
  const shortcuts: MetadataRoute.Manifest["shortcuts"] = [
    { name: m.landing.choose.start, short_name: m.common.nav.start, url: to("/start"), icons: ICON },
    { name: m.landing.choose.guide, short_name: m.common.nav.calculator, url: to("/guide"), icons: ICON },
    { name: m.landing.choose.ask, url: to("/ask"), icons: ICON },
    // The ledger is in English, so only the English app offers it.
    locale === "en"
      ? { name: m.common.nav.yourLedger, url: "/dashboard", icons: ICON }
      : { name: m.landing.choose.fitr, short_name: m.common.footer.fitr, url: to("/zakat-al-fitr"), icons: ICON },
  ];
  return {
    // One app whichever language it was added in.
    id: "/",
    name: m.landing.metaTitle,
    short_name: "Mizan",
    description: m.landing.metaDescription,
    lang: locale,
    dir: LOCALE_INFO[locale].dir,
    start_url: to("/"),
    scope: "/",
    display: "standalone",
    background_color: "#F3F5F1",
    theme_color: "#0E2A22",
    categories: ["finance", "lifestyle", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts,
  };
}
