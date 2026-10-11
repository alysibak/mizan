import { notFound } from "next/navigation";
import WhoView, { whoMetadata } from "@/components/public/WhoView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? whoMetadata(locale) : {};
}

export default async function LocalizedWhoCanReceive({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <WhoView locale={locale} /> : notFound();
}
