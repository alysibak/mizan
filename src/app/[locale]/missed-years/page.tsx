import { notFound } from "next/navigation";
import MissedView, { missedMetadata } from "@/components/public/MissedView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? missedMetadata(locale) : {};
}

export default async function LocalizedMissedYears({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <MissedView locale={locale} /> : notFound();
}
