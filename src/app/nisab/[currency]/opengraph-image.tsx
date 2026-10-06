import { NISAB_CARD_SIZE, nisabCard } from "@/lib/nisab-card";
import { isNisabCurrency } from "@/components/public/NisabViews";

export const alt = "Today’s nisab on the silver and gold standards";
export const size = NISAB_CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  return nisabCard(isNisabCurrency(currency) ? currency.toUpperCase() : "USD");
}
