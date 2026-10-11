import { notFound } from "next/navigation";
import WorksheetView, { worksheetMetadata } from "@/components/public/WorksheetView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? worksheetMetadata(locale) : {};
}

export default async function LocalizedWorksheet({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <WorksheetView locale={locale} /> : notFound();
}
