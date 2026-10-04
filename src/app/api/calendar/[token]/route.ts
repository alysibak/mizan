import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { hashFeedToken } from "@/lib/calendar-feed";
import { hawlStatus, parseHijriCalendar } from "@/lib/hijri";
import { isIsoDay } from "@/lib/dates";
import { hawlCalendar } from "@/lib/ics";
import { userToday } from "@/lib/today";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/**
 * A private calendar subscription with the next hawl reckoning day and a
 * reminder the day before. Calendar apps poll it, so reminders need no push
 * service. It carries a date only — never amounts.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;
  const raw = token.replace(/\.ics$/, "");
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(raw)) return new Response("Not found", { status: 404 });

  const [row] = await db
    .select({
      hawlStartDate: settings.hawlStartDate,
      hijriCalendar: settings.hijriCalendar,
      timezone: settings.timezone,
    })
    .from(settings)
    .where(eq(settings.calendarTokenHash, hashFeedToken(raw)))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const calendar = parseHijriCalendar(row.hijriCalendar);
  const dueDay =
    row.hawlStartDate && isIsoDay(row.hawlStartDate)
      ? hawlStatus(row.hawlStartDate, userToday(row.timezone), calendar)
          .dueDate.toISOString()
          .slice(0, 10)
      : null;

  return new Response(
    hawlCalendar({
      dueDay,
      calendarLabel: calendar === "umalqura" ? "Umm al-Qura" : "lunar",
      alarm: true,
      name: "Mizan hawl",
    }),
    {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, max-age=3600",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
