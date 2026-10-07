import StartView, { startMetadata } from "@/components/public/StartView";

export const metadata = startMetadata("en");

export default function StartPage() {
  return <StartView locale="en" />;
}
