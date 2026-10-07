import { notFound } from "next/navigation";
import StartView, { startMetadata } from "@/components/public/StartView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? startMetadata(locale) : {};
}

export default async function LocalizedStart({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <StartView locale={locale} /> : notFound();
}
