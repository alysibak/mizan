/** A minimal iCalendar file for the hawl due day. No amounts are included. */

function icsDay(day: string): string {
  return day.replace(/-/g, "");
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
      "SUMMARY:Mizan — hawl reckoning day",
      `DESCRIPTION:One ${opts.calendarLabel} year is complete. Confirm with local moon-sighting before paying. Open Mizan → The year.`,
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
