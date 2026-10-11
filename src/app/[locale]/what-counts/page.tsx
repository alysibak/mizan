import { notFound } from "next/navigation";
import AppliesView, { appliesMetadata } from "@/components/public/AppliesView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? appliesMetadata(locale) : {};
}

export default async function LocalizedWhatCounts({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <AppliesView locale={locale} /> : notFound();
}
