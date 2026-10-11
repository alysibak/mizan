import { notFound } from "next/navigation";
import AskView, { askMetadata } from "@/components/public/AskView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? askMetadata(locale) : {};
}

export default async function LocalizedAsk({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <AskView locale={locale} /> : notFound();
}
