"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SIGNED_IN_HINT } from "@/lib/constants";

function signedIn(): boolean {
  return document.cookie.split("; ").some((c) => c === `${SIGNED_IN_HINT}=1`);
}

/**
 * The header's account links. Public pages are the same static file for
 * everyone, so this checks in the browser whether the visitor is signed in
 * and offers their ledger instead of "Sign in".
 */
export default function AccountLinks({
  signIn,
  openLedger,
  yourLedger,
}: {
  signIn: string;
  openLedger: string;
  yourLedger: string;
}) {
  const isSignedIn = useSyncExternalStore(
    () => () => {},
    signedIn,
    () => false,
  );
  if (isSignedIn) {
    return (
      <Link href="/dashboard" className="btn-primary">
        {yourLedger}
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="text-sage hover:text-ink">
        {signIn}
      </Link>
      <Link href="/register" className="btn-primary">
        {openLedger}
      </Link>
    </>
  );
}
