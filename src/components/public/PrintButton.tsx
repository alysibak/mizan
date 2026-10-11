"use client";

/** Opens the browser's print dialog (and "Save as PDF"). */
export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn-primary px-5 py-3 text-base" onClick={() => window.print()}>
      {label}
    </button>
  );
}
