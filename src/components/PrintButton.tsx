"use client";

export default function PrintButton({ label = "Print or save PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn-ghost print:hidden" onClick={() => window.print()}>
      {label}
    </button>
  );
}
