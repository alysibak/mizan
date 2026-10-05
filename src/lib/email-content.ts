// What Mizan's emails say, and when a hawl reminder is due. Pure functions,
// so the wording and timing are tested without sending anything.

import { daysBetween, formatHijri, type HijriCalendar } from "./hijri";
import type { EmailMessage } from "./email";

/** Reset links are short-lived; a confirmation link can wait a day. */
export const RESET_LINK_MINUTES = 30;
export const VERIFY_LINK_HOURS = 24;

/** Days before the hawl day that the first reminder goes out. */
export const REMINDER_LEAD_DAYS = 7;

export type ReminderKind = "week" | "day";

/** Which reminder, if any, is due today for a hawl ending on `dueDay`. */
export function reminderKind(dueDay: string, today: Date): ReminderKind | null {
  const left = daysBetween(today, new Date(`${dueDay}T00:00:00Z`));
  if (left <= 0) return "day";
  if (left <= REMINDER_LEAD_DAYS) return "week";
  return null;
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
  kind: ReminderKind;
  calendar: HijriCalendar;
  link: string;
}): EmailMessage {
  const when = `${longDate(opts.dueDay)} (${formatHijri(opts.dueDay, opts.calendar)})`;
  const subject =
    opts.kind === "day" ? "Your zakat year is complete" : "Your zakat year closes in a week";
  const lead =
    opts.kind === "day"
      ? `Your hawl, the year your wealth has been held above nisab, completed on ${when}.`
      : `Your hawl, the year your wealth has been held above nisab, completes on ${when}.`;
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
