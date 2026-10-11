import AskView, { askMetadata } from "@/components/public/AskView";

export const metadata = askMetadata("en");

export default function AskPage() {
  return <AskView locale="en" />;
}
