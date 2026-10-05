import LandingView, { landingMetadata } from "@/components/public/LandingView";

export const metadata = landingMetadata("en");

export default function LandingPage() {
  return <LandingView locale="en" />;
}
