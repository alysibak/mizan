import { NisabIndexView, nisabIndexMetadata } from "@/components/public/NisabViews";

// Rebuilt at most hourly with fresh prices; served from cache in between.
export const revalidate = 3600;

export const metadata = nisabIndexMetadata("en");

export default function NisabIndexPage() {
  return <NisabIndexView locale="en" />;
}
