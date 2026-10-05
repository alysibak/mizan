import { notFound } from "next/navigation";
import {
  NisabCurrencyView,
  currencyParams,
  isNisabCurrency,
  nisabCurrencyMetadata,
} from "@/components/public/NisabViews";
import { isLocale } from "@/i18n/config";

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; currency: string }> };

export function generateStaticParams() {
  return currencyParams();
}

export async function generateMetadata({ params }: Props) {
  const { locale, currency } = await params;
  return isLocale(locale) && isNisabCurrency(currency)
    ? nisabCurrencyMetadata(locale, currency.toUpperCase())
    : {};
}

export default async function LocalizedNisabCurrency({ params }: Props) {
  const { locale, currency } = await params;
  if (!isLocale(locale) || !isNisabCurrency(currency)) notFound();
  return <NisabCurrencyView locale={locale} code={currency.toUpperCase()} />;
}
