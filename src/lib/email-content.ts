// What Mizan's emails say, and when a hawl reminder is due. Pure functions,
// so the wording and timing are tested without sending anything.

import { daysBetween, formatHijri, type HijriCalendar } from "./hijri";
import type { EmailMessage } from "./email";

/** Reset links are short-lived; a confirmation link can wait a day. */
export const RESET_LINK_MINUTES = 30;
export const VERIFY_LINK_HOURS = 24;

/** Days before the hawl day that the first reminder goes out. */
export const REMINDER_LEAD_DAYS = 7;

/** A day-of reminder still goes out this many days late (missed runs). */
export const REMINDER_GRACE_DAYS = 2;

export type ReminderKind = "week" | "day";

export interface ReminderDue {
  kind: ReminderKind;
  /** Days until the hawl day: 0 on the day, negative when late. */
  daysLeft: number;
}

/**
 * Which reminder, if any, is due today for a hawl ending on `dueDay`. The
 * lead reminder goes out on the first run within the last week (so someone
 * who opts in three days ahead still gets it); the day-of one on the day or
 * shortly after. A hawl day long past gets nothing: that is for the app to
 * show, not for an email that says "today".
 */
export function reminderDue(dueDay: string, today: Date): ReminderDue | null {
  const daysLeft = daysBetween(today, new Date(`${dueDay}T00:00:00Z`));
  if (daysLeft > REMINDER_LEAD_DAYS || daysLeft < -REMINDER_GRACE_DAYS) return null;
  return { kind: daysLeft <= 0 ? "day" : "week", daysLeft };
}

/** Recorded after sending, so each reminder goes out once. */
export function reminderKey(dueDay: string, kind: ReminderKind): string {
  return `${dueDay}:${kind}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function longDate(day: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

const SIGN_OFF = "\n\n— Mizan\n\nYou are receiving this because of your account on Mizan.";

export function verifyEmailMessage(opts: { to: string; name: string; link: string }): EmailMessage {
  return {
    to: opts.to,
    subject: "Confirm your email for Mizan",
    text:
      `Assalamu alaikum ${firstName(opts.name)},\n\n` +
      `Confirm this address to receive password-reset links and, if you turn them on, hawl reminders:\n\n` +
      `${opts.link}\n\n` +
      `The link works once, for ${VERIFY_LINK_HOURS} hours. If you did not ask for it, ignore this message.` +
      SIGN_OFF,
  };
}

export function resetEmailMessage(opts: { to: string; link: string }): EmailMessage {
  return {
    to: opts.to,
    subject: "Reset your Mizan password",
    text:
      `Someone asked to reset the password for this Mizan account. If it was you, choose a new one here:\n\n` +
      `${opts.link}\n\n` +
      `The link works once, for ${RESET_LINK_MINUTES} minutes, and signs out every other device. ` +
      `If it was not you, ignore this message: your password has not changed.` +
      SIGN_OFF,
  };
}

export function reminderEmailMessage(opts: {
  to: string;
  name: string;
  dueDay: string;
  due: ReminderDue;
  calendar: HijriCalendar;
  link: string;
}): EmailMessage {
  const when = `${longDate(opts.dueDay)} (${formatHijri(opts.dueDay, opts.calendar)})`;
  const { kind, daysLeft } = opts.due;
  const subject =
    kind === "day"
      ? "Your zakat year is complete"
      : daysLeft === 1
        ? "Your zakat year closes tomorrow"
        : `Your zakat year closes in ${daysLeft} days`;
  const hawl = "Your hawl, the year your wealth has been held above nisab,";
  const lead =
    kind === "week"
      ? `${hawl} completes on ${when}.`
      : daysLeft === 0
        ? `${hawl} completes today, ${when}.`
        : `${hawl} completed on ${when}.`;
  return {
    to: opts.to,
    subject,
    text:
      `Assalamu alaikum ${firstName(opts.name)},\n\n` +
      `${lead} That is the day to weigh what you hold and work out the zakat due. ` +
      `Confirm the date with your local moon-sighting if you follow one.\n\n` +
      `Open your year in Mizan:\n${opts.link}\n\n` +
      `To stop these reminders, turn them off in Settings.` +
      SIGN_OFF,
  };
}
