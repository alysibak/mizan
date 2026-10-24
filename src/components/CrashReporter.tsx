"use client";

import { useEffect } from "react";
import { crashNote, sendCrash, worthReporting } from "@/lib/crash-report";

/** Listens for errors that break a page, and reports them (see lib/crash-report). */
export default function CrashReporter() {
  useEffect(() => {
    const origin = window.location.origin;
    const onError = (e: ErrorEvent) => {
      if (worthReporting(e.message, e.filename, origin)) sendCrash(crashNote(e.message, e.filename, e.lineno, e.colno));
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason instanceof Error ? `${e.reason.name}: ${e.reason.message}` : String(e.reason);
      if (worthReporting(reason, undefined, origin)) sendCrash(crashNote(`Unhandled: ${reason}`));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
