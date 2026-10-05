import { notFound } from "next/navigation";
import { Noto_Naskh_Arabic } from "next/font/google";
import HtmlLang from "@/components/HtmlLang";
import { LOCALE_INFO, PREFIXED_LOCALES, isLocale } from "@/i18n/config";

// Arabic and Urdu need a face with Arabic script; Latin text and digits fall
// back to the site's own faces.
const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-naskh",
  display: "swap",
});

// Only the languages Mizan has; anything else under this segment is a 404
// without rendering (and without caching a page for each path a bot tries).
export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  const { dir } = LOCALE_INFO[locale];
  return (
    <div
      lang={locale}
      dir={dir}
      className={dir === "rtl" ? `${naskh.variable} script-arabic` : undefined}
    >
      <HtmlLang lang={locale} dir={dir} />
      {children}
    </div>
  );
}
