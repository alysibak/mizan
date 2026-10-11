import { notFound } from "next/navigation";
import PosterView, { posterMetadata } from "@/components/public/PosterView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? posterMetadata(locale) : {};
}

export default async function LocalizedPoster({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <PosterView locale={locale} /> : notFound();
}
