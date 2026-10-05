import { notFound } from "next/navigation";
import LandingView, { landingMetadata } from "@/components/public/LandingView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? landingMetadata(locale) : {};
}

export default async function LocalizedLanding({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <LandingView locale={locale} /> : notFound();
}
