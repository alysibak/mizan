import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { emailEnabled, emailLink, sendEmail } from "@/lib/email";
import { reminderEmailMessage, reminderKey, reminderKind } from "@/lib/email-content";
import { hawlDueDate, parseHijriCalendar } from "@/lib/hijri";
import { isIsoDay } from "@/lib/dates";
import { isDemoUser } from "@/lib/demo";
import { userToday } from "@/lib/today";

export const dynamic = "force-dynamic";
// A large user base takes a while to go through.
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily: email everyone who opted in, a week before their hawl day and on
 * the day. Vercel Cron calls it with CRON_SECRET; elsewhere, any scheduler
 * can (see .env.example). Each reminder is sent once.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Not found", { status: 404 });
  if (!emailEnabled()) return NextResponse.json({ checked: 0, sent: 0, email: "off" });

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      hawlStartDate: settings.hawlStartDate,
      hijriCalendar: settings.hijriCalendar,
      timezone: settings.timezone,
      reminderSentFor: settings.reminderSentFor,
    })
    .from(settings)
    .innerJoin(users, eq(users.id, settings.userId))
    .where(
      and(
        eq(settings.emailReminders, true),
        isNotNull(users.emailVerifiedAt),
        isNotNull(settings.hawlStartDate),
      ),
    );

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    if (!row.hawlStartDate || !isIsoDay(row.hawlStartDate) || isDemoUser(row)) continue;
    const calendar = parseHijriCalendar(row.hijriCalendar);
    const dueDay = hawlDueDate(row.hawlStartDate, calendar).toISOString().slice(0, 10);
    const kind = reminderKind(dueDay, userToday(row.timezone));
    if (!kind) continue;
    const key = reminderKey(dueDay, kind);
    if (row.reminderSentFor === key) continue;
    // Once the day itself has been sent, a late run must not go back to
    // sending the week-before message.
    if (kind === "week" && row.reminderSentFor === reminderKey(dueDay, "day")) continue;

    const ok = await sendEmail(
      reminderEmailMessage({
        to: row.email,
        name: row.name,
        dueDay,
        kind,
        calendar,
        link: emailLink("/year"),
      }),
    );
    if (!ok) {
      failed += 1;
      continue;
    }
    sent += 1;
    await db.update(settings).set({ reminderSentFor: key }).where(eq(settings.userId, row.userId));
  }
  return NextResponse.json({ checked: rows.length, sent, failed });
}
