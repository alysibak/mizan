"use client";

import Link from "next/link";
import { CALC_STORAGE_KEY, draftIsEmpty, parseDraft } from "@/lib/calculator";
import { useHydrated, useStoredValues } from "@/lib/client-store";
import { MY_KEY } from "@/lib/my-zakat";
import { PHONE_KEYS } from "@/lib/phone-features";

const KEYS = [...PHONE_KEYS, CALC_STORAGE_KEY, MY_KEY];

/**
 * "My zakat" in the top bar, only once this phone has kept something: a
 * first-time visitor has nothing there yet, and one fewer thing to read.
 */
export default function MyZakatChip() {
  const hydrated = useHydrated();
  const read = useStoredValues(KEYS);
  if (!hydrated) return null;
  const draft = parseDraft(read(CALC_STORAGE_KEY));
  const kept = PHONE_KEYS.some((k) => read(k)) || Boolean(read(MY_KEY)) || (draft !== null && !draftIsEmpty(draft));
  if (!kept) return null;
  return (
    <Link
      href="/my"
      className="inline-flex min-h-[44px] items-center whitespace-nowrap px-1 text-sm font-medium text-pine hover:text-ink"
    >
      My zakat
    </Link>
  );
}
