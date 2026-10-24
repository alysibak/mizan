/**
 * "Report a problem": what a visitor may send, checked before it is kept.
 * Pure, so it is tested.
 */
import { LOCALES, type Locale } from "@/i18n/config";
import { cleanText } from "@/lib/neighbours";

export const PROBLEM_KINDS = ["wrong", "broken", "hard", "other"] as const;
/** Sent by the page itself when it breaks (see lib/crash-report). */
const SENT_KINDS = [...PROBLEM_KINDS, "crash"] as const;
export type ProblemKind = (typeof SENT_KINDS)[number];
export const PROBLEM_NOTE_MAX = 1000;

export interface ProblemInput {
  kind: ProblemKind;
  page: string;
  note: string;
  contact: string | null;
  locale: Locale;
}

/** A path on this site, as the page reported it; anything else is dropped. */
function samePagePath(v: unknown): string {
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//")) return "";
  return v.split(/[?#]/)[0].slice(0, 120);
}

export function readProblem(body: unknown): { problem: ProblemInput } | { error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (!(SENT_KINDS as readonly string[]).includes(b.kind as string)) return { error: "Choose what kind of problem." };
  const note = cleanText(b.note, PROBLEM_NOTE_MAX);
  if (note.length < 3) return { error: "Say what happened, in a few words." };
  const contact = cleanText(b.contact, 120).replace(/\n/g, " ");
  const locale = (LOCALES as readonly string[]).includes(b.locale as string) ? (b.locale as Locale) : "en";
  return { problem: { kind: b.kind as ProblemKind, page: samePagePath(b.page), note, contact: contact || null, locale } };
}
