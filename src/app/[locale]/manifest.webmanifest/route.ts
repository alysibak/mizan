import { PREFIXED_LOCALES, isLocale } from "@/i18n/config";
import { appManifest } from "@/lib/manifest";

// The home-screen app in each language, linked from that language's pages.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") return new Response("Not found", { status: 404 });
  return Response.json(appManifest(locale), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
