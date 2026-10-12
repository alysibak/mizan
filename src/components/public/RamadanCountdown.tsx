"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/client-store";
import { ramadanStatus } from "@/lib/hijri";
import { hawlCalendar } from "@/lib/ics";
import { track } from "@/lib/analytics";
import { LOCALE_INFO, fmt, localePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

const DAY = 86_400_000;

/** How a language marks a Hijri year, where the browser's own word is not the one people use. */
const HIJRI_ERA: Partial<Record<Locale, string>> = {
  // Browsers say "যুগ" (era); Bengali readers write "হিজরি".
  bn: "হিজরি",
};

/** Today in the Islamic calendar, in the page's language, where the browser can say it. */
function hijriToday(today: Date, locale: Locale): string | null {
  try {
    const parts = new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, {
      calendar: "islamic-umalqura",
      dateStyle: "long",
      timeZone: "UTC",
    }).formatToParts(today);
    const era = HIJRI_ERA[locale];
    return parts.map((p) => (p.type === "era" && era ? era : p.value)).join("");
  } catch {
    return null;
  }
}

/**
 * Today's Islamic date and how far off Ramadan is (or which day of it this
 * is), since many people give their zakat in Ramadan. Worked out in the
 * browser, so a page built once still counts from today.
 */
export default function RamadanCountdown({
  m,
  locale,
  className = "",
}: {
  m: Messages["ramadan"];
  locale: Locale;
  className?: string;
}) {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  const intl = LOCALE_INFO[locale].intl;
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const status = ramadanStatus(today);
  const date = (d: Date) => d.toLocaleDateString(intl, { dateStyle: "long", timeZone: "UTC" });
  const when = new Intl.RelativeTimeFormat(intl, { numeric: "auto" }).format(status.daysUntil, "day");
  const hijri = hijriToday(today, locale);
  const reminderDay = new Date(status.start.getTime() - 7 * DAY);

  function remind() {
    const ics = hawlCalendar({
      dueDay: reminderDay.toISOString().slice(0, 10),
      calendarLabel: "lunar",
      summary: m.reminderSummary,
      description: `${m.reminderBody} ${new URL(localePath(locale, "/guide"), window.location.origin)}`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ramadan-reminder.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("Reminder", { via: "ramadan" });
  }

  return (
    <div className={"border border-brass/50 bg-paper/80 px-4 py-3 text-sm " + className}>
      <p className="text-ink">
        {hijri ? `${fmt(m.today, { date: hijri })} ` : null}
        {status.inRamadan
          ? fmt(m.during, { day: status.day ?? 1, date: date(status.eid) })
          : fmt(m.before, { year: status.hijriYear, date: date(status.start), when })}
      </p>
      <p className="mt-1 text-sage">{status.inRamadan ? m.duringHint : m.hint}</p>
      {status.inRamadan ? (
        <Link
          href={localePath(locale, "/zakat-al-fitr")}
          className="mt-2 inline-block font-medium text-pine hover:underline"
        >
          {m.fitrLink}
        </Link>
      ) : status.daysUntil > 7 ? (
        <button
          type="button"
          className="mt-2 font-medium text-pine underline-offset-2 hover:underline"
          onClick={remind}
        >
          {m.remind}
        </button>
      ) : null}
    </div>
  );
}
