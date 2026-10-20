"use client";

import Link from "next/link";
import { useSignedIn } from "@/components/useSignedIn";

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
  if (useSignedIn()) {
    return (
      <Link href="/dashboard" className="btn-primary whitespace-nowrap px-3 sm:px-4">
        {yourLedger}
      </Link>
    );
  }
  // On a phone there is room for one: returning visitors need "Sign in", and
  // new ones meet "Open a free ledger" on the page itself.
  return (
    <>
      <Link href="/login" className="whitespace-nowrap text-sage hover:text-ink">
        {signIn}
      </Link>
      <Link href="/register" className="btn-primary hidden whitespace-nowrap sm:inline-flex">
        {openLedger}
      </Link>
    </>
  );
}
