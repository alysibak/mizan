import { notFound } from "next/navigation";
import CalculatorView, { calculatorMetadata } from "@/components/public/CalculatorView";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? calculatorMetadata(locale) : {};
}

export default async function LocalizedCalculator({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale) ? <CalculatorView locale={locale} /> : notFound();
}
