import AppliesView, { appliesMetadata } from "@/components/public/AppliesView";

export const metadata = appliesMetadata("en");

export default function WhatCountsPage() {
  return <AppliesView locale="en" />;
}
