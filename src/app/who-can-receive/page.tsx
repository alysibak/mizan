import WhoView, { whoMetadata } from "@/components/public/WhoView";

export const metadata = whoMetadata("en");

export default function WhoCanReceivePage() {
  return <WhoView locale="en" />;
}
