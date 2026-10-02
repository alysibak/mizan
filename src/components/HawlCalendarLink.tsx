"use client";


function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** All-day ICS date YYYYMMDD in UTC from a Date. */
function icsDay(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function nextDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
}

export default function HawlCalendarLink({
  dueDate,
}: {
  /** The hawl due day (YYYY-MM-DD), computed on the server in the user's calendar. */
  dueDate: string;
}) {
  function download() {
    const due = new Date(`${dueDate}T00:00:00Z`);
    const start = icsDay(due);
    const end = icsDay(nextDay(due));
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mizan//Hawl//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:hawl-${start}@mizan.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      "SUMMARY:Mizan — hawl reckoning day",
      "DESCRIPTION:Tabular lunar year complete. Confirm with local moon-sighting before paying. Open Mizan → The year.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mizan-hawl.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking synchronously can cancel the download in Safari and Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button type="button" className="btn-ghost text-sm" onClick={download}>
      Add reckoning day to calendar
    </button>
  );
}
