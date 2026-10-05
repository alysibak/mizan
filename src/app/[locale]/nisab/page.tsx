import { notFound } from "next/navigation";
import { NisabIndexView, nisabIndexMetadata } from "@/components/public/NisabViews";
import { isLocale } from "@/i18n/config";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? nisabIndexMetadata(locale) : {};
}

export default async function LocalizedNisabIndex({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <NisabIndexView locale={locale} /> : notFound();
}
