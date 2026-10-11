import { notFound } from "next/navigation";
import GuideView, { guideMetadata } from "@/components/public/GuideView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? guideMetadata(locale) : {};
}

export default async function LocalizedGuide({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <GuideView locale={locale} /> : notFound();
}
