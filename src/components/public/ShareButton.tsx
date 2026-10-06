"use client";

import { useState } from "react";
import { useHydrated } from "@/lib/client-store";
import { track } from "@/lib/analytics";

export interface ShareLabels {
  button: string;
  whatsapp: string;
  copy: string;
  copied: string;
}

/**
 * Share a public page. Phones get their own share sheet; elsewhere,
 * WhatsApp (where most of these links travel) and a copy-link button. The
 * text never carries anything the visitor typed.
 */
export default function ShareButton({
  label,
  text,
  path,
  labels,
}: {
  /** What is being shared, e.g. "Share today’s nisab". */
  label: string;
  text: string;
  /** The page's own path, made absolute in the browser. */
  path: string;
  labels: ShareLabels;
}) {
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);
  const url = hydrated ? new URL(path, window.location.origin).toString() : path;
  const canShare = hydrated && typeof navigator.share === "function";

  if (canShare) {
    return (
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          track("Share", { via: "device" });
          navigator.share({ text, url }).catch(() => {
            /* closed without sharing */
          });
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm text-sage">{labels.button}:</span>
      <a
        className="btn-ghost"
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("Share", { via: "whatsapp" })}
      >
        {labels.whatsapp}
      </a>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          track("Share", { via: "copy" });
          navigator.clipboard
            ?.writeText(url)
            .then(() => setCopied(true))
            .catch(() => {
              /* clipboard refused: the link is in the address bar */
            });
        }}
      >
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  );
}
