import SourcesView, { sourcesMetadata } from "@/components/public/SourcesView";

export const metadata = sourcesMetadata("en");

export default function SourcesPage() {
  return <SourcesView locale="en" />;
}
