import { notFound } from "next/navigation";
import FitrView, { fitrMetadata } from "@/components/public/FitrView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? fitrMetadata(locale) : {};
}

export default async function LocalizedZakatAlFitr({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <FitrView locale={locale} /> : notFound();
}
