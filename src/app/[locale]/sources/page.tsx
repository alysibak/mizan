import { notFound } from "next/navigation";
import SourcesView, { sourcesMetadata } from "@/components/public/SourcesView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? sourcesMetadata(locale) : {};
}

export default async function LocalizedSources({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <SourcesView locale={locale} /> : notFound();
}
