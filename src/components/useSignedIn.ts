"use client";

import { useSyncExternalStore } from "react";
import { SIGNED_IN_HINT } from "@/lib/constants";

function signedIn(): boolean {
  return document.cookie.split("; ").some((c) => c === `${SIGNED_IN_HINT}=1`);
}

/**
 * Whether the visitor is signed in. Public pages are the same static file for
 * everyone, so this reads the hint cookie in the browser; it is false while
 * the page is first drawn.
 */
export function useSignedIn(): boolean {
  return useSyncExternalStore(
    () => () => {},
    signedIn,
    () => false,
  );
}
