import { notFound } from "next/navigation";
import ReportView, { reportMetadata } from "@/components/public/ReportView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? reportMetadata(locale) : {};
}

export default async function LocalizedReport({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <ReportView locale={locale} /> : notFound();
}
