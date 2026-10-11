import GuideView, { guideMetadata } from "@/components/public/GuideView";

export const metadata = guideMetadata("en");

export default function GuidePage() {
  return <GuideView locale="en" />;
}
