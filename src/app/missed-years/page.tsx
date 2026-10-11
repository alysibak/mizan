import MissedView, { missedMetadata } from "@/components/public/MissedView";

export const metadata = missedMetadata("en");

export default function MissedYearsPage() {
  return <MissedView locale="en" />;
}
