import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { writableUser } from "@/lib/api";
import { hawlStatus, parseHijriCalendar } from "@/lib/hijri";
import { userToday } from "@/lib/today";
import { isIsoDay, isoDay } from "@/lib/dates";

/**
 * Start the next hawl on the tabular due day of the current one. The server
 * computes the date and refuses while the current hawl is still running, so
 * a stale page or a double click cannot push the hawl into the future.
 */
export async function POST() {
  const { user, response } = await writableUser();
  if (response) return response;

  const current = await getUserSettings(user.id);
  if (!current.hawlStartDate || !isIsoDay(current.hawlStartDate)) {
    return NextResponse.json(
      { error: "Set a hawl start in settings first." },
      { status: 400 },
    );
  }

  const status = hawlStatus(
    current.hawlStartDate,
    userToday(current.timezone),
    parseHijriCalendar(current.hijriCalendar),
  );
  const due = isoDay(status.dueDate);
  if (!status.isComplete) {
    return NextResponse.json(
      { error: `This hawl runs until ${due}. Roll it after that day.` },
      { status: 409 },
    );
  }

  await db
    .update(settings)
    .set({ hawlStartDate: due, updatedAt: new Date().toISOString() })
    .where(eq(settings.userId, user.id));

  return NextResponse.json({ ok: true, hawlStartDate: due });
}
