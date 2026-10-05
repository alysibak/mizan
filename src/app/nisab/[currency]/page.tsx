import { notFound } from "next/navigation";
import {
  NisabCurrencyView,
  currencyParams,
  isNisabCurrency,
  nisabCurrencyMetadata,
} from "@/components/public/NisabViews";

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ currency: string }> };

export function generateStaticParams() {
  return currencyParams();
}

export async function generateMetadata({ params }: Props) {
  const { currency } = await params;
  return isNisabCurrency(currency) ? nisabCurrencyMetadata("en", currency.toUpperCase()) : {};
}

export default async function NisabCurrencyPage({ params }: Props) {
  const { currency } = await params;
  if (!isNisabCurrency(currency)) notFound();
  return <NisabCurrencyView locale="en" code={currency.toUpperCase()} />;
}
