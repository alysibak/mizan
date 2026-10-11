import PosterView, { posterMetadata } from "@/components/public/PosterView";

export const metadata = posterMetadata("en");

export default function PosterPage() {
  return <PosterView locale="en" />;
}
