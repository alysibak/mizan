/** A minimal iCalendar file for the hawl due day. No amounts are included. */

function icsDay(day: string): string {
  return day.replace(/-/g, "");
}

/** Text escaped for an iCalendar property value (RFC 5545 §3.3.11). */
function icsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function nextDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function hawlCalendar(opts: {
  /** YYYY-MM-DD hawl due day; null gives an empty calendar. */
  dueDay: string | null;
  calendarLabel: string;
  now?: Date;
  /** Include a reminder the day before (for subscribed feeds). */
  alarm?: boolean;
  /** Feed name shown by calendar apps. */
  name?: string;
  /** The event's title and note, e.g. in the visitor's language. */
  summary?: string;
  description?: string;
}): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mizan//Hawl//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (opts.name) {
    lines.push(`X-WR-CALNAME:${opts.name}`, "REFRESH-INTERVAL;VALUE=DURATION:PT12H", "X-PUBLISHED-TTL:PT12H");
  }
  if (opts.dueDay) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:hawl-${icsDay(opts.dueDay)}@mizan.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDay(opts.dueDay)}`,
      `DTEND;VALUE=DATE:${icsDay(nextDay(opts.dueDay))}`,
      `SUMMARY:${icsText(opts.summary ?? "Mizan — hawl reckoning day")}`,
      `DESCRIPTION:${icsText(
        opts.description ??
          `One ${opts.calendarLabel} year is complete. Confirm with local moon-sighting before paying. Open Mizan → The year.`,
      )}`,
      "TRANSP:TRANSPARENT",
    );
    if (opts.alarm) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Hawl reckoning tomorrow",
        "TRIGGER:-P1D",
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * Reminders for a giving plan: one short event per evening at a local time
 * (floating, so it follows the phone wherever it is), each with its own
 * alert. `events` carry their own words, in the visitor's language.
 */
export function eveningsCalendar(opts: {
  events: { day: string; summary: string; description: string }[];
  /** Local time of day, "HH:MM". */
  time?: string;
  uid: string;
  now?: Date;
}): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const [hh, mm] = (opts.time ?? "19:30").split(":");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mizan//Plan//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of opts.events) {
    const start = `${icsDay(e.day)}T${hh}${mm}00`;
    const endMinutes = Number(hh) * 60 + Number(mm) + 15;
    const end = `${icsDay(e.day)}T${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}${String(endMinutes % 60).padStart(2, "0")}00`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${opts.uid}-${icsDay(e.day)}@mizan.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsText(e.summary)}`,
      `DESCRIPTION:${icsText(e.description)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(e.summary)}`,
      "TRIGGER:PT0S",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * Whole-day events, each with a reminder a week before and another on the
 * morning of the day: for a zakat day that falls on a different Gregorian
 * date each year, so it cannot be a simple yearly repeat.
 */
export function daysCalendar(opts: {
  events: { day: string; summary: string; description: string }[];
  uid: string;
  now?: Date;
}): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mizan//Zakat day//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of opts.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${opts.uid}-${icsDay(e.day)}@mizan.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDay(e.day)}`,
      `DTEND;VALUE=DATE:${icsDay(nextDay(e.day))}`,
      `SUMMARY:${icsText(e.summary)}`,
      `DESCRIPTION:${icsText(e.description)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(`${e.summary}: in a week`)}`,
      "TRIGGER:-P7D",
      "END:VALARM",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(e.summary)}`,
      "TRIGGER:PT9H",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
