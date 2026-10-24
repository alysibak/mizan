/**
 * "Was this easy?" and the journey counts: what a visitor may send, checked
 * before anything is kept. Pure, so it is tested; shared by the page and the
 * server. Nothing here can carry who someone is or what they have.
 */
import { LOCALES, type Locale } from "@/i18n/config";

/** Where the question is asked: the guide's answer, Home in an account, and after a promise to a family. */
export const FEEDBACK_PAGES = ["guide", "account", "neighbours"] as const;
export type FeedbackPage = (typeof FEEDBACK_PAGES)[number];

export const NOTE_MAX = 500;
/** A line can be added for this long after the tap. */
export const NOTE_MINUTES = 60;

/**
 * The main journey, in order: the home page, a number typed there, the
 * guide, its answer, a reminder, an account, its setup finished.
 */
export const JOURNEY_STEPS = ["home", "typed", "guide", "answer", "reminder", "signup", "setup"] as const;
export type JourneyStep = (typeof JOURNEY_STEPS)[number];

export const JOURNEY_LABELS: Record<JourneyStep, string> = {
  home: "Opened the home page",
  typed: "Typed a number there",
  guide: "Opened the guide",
  answer: "Saw their answer",
  reminder: "Asked for a reminder",
  signup: "Made an account",
  setup: "Finished setting it up",
};

export function isJourneyStep(value: unknown): value is JourneyStep {
  return typeof value === "string" && (JOURNEY_STEPS as readonly string[]).includes(value);
}

export type FeedbackInput =
  | { kind: "answer"; page: FeedbackPage; easy: boolean; locale: Locale }
  | { kind: "note"; id: string; note: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A tap (yes or no), or a line added to one: anything else is refused. */
export function readFeedback(body: unknown): FeedbackInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.id === "string") {
    if (!UUID.test(b.id) || typeof b.note !== "string") return null;
    // Control characters out, spaces tidied, and kept short.
    const note = b.note
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
      .trim()
      .slice(0, NOTE_MAX);
    return note ? { kind: "note", id: b.id, note } : null;
  }
  if (typeof b.easy !== "boolean") return null;
  if (!(FEEDBACK_PAGES as readonly string[]).includes(b.page as string)) return null;
  const locale = (LOCALES as readonly string[]).includes(b.locale as string) ? (b.locale as Locale) : "en";
  return { kind: "answer", page: b.page as FeedbackPage, easy: b.easy, locale };
}

/** The day a count belongs to, in UTC. */
export function countDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}
