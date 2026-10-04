"use client";

import { hawlCalendar } from "@/lib/ics";

export default function HawlCalendarLink({
  dueDate,
}: {
  /** The hawl due day (YYYY-MM-DD), computed on the server in the user's calendar. */
  dueDate: string;
}) {
  function download() {
    const ics = hawlCalendar({ dueDay: dueDate, calendarLabel: "lunar" });
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
