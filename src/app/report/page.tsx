import ReportView, { reportMetadata } from "@/components/public/ReportView";

export const metadata = reportMetadata("en");

export default function ReportPage() {
  return <ReportView locale="en" />;
}
