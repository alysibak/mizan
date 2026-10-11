import WorksheetView, { worksheetMetadata } from "@/components/public/WorksheetView";

export const metadata = worksheetMetadata("en");

export default function WorksheetPage() {
  return <WorksheetView locale="en" />;
}
