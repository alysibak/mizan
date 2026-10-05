import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, settings } from "@/db/schema";
import { SESSION_COOKIE, hashToken } from "./auth";
import type { User, Settings } from "@/db/schema";

/** Resolve the signed-in user from the session cookie. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.id, hashToken(token)),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  return rows[0]?.user ?? null;
});

/** Defaults applied in memory when a user has no settings row yet. */
export const DEFAULT_SETTINGS: Omit<Settings, "userId" | "updatedAt"> = {
  currency: "CAD",
  nisabStandard: "silver",
  calendarBasis: "lunar",
  goldPricePerGram: 90,
  silverPricePerGram: 1.05,
  metalsUpdatedAt: null,
  hawlStartDate: null,
  madhhab: "general",
  setupComplete: false,
  trustedAckAt: null,
  timezone: null,
  hijriCalendar: "tabular",
  calendarTokenHash: null,
  emailReminders: false,
  reminderSentFor: null,
};

export async function getUserSettings(userId: string): Promise<Settings> {
  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);
  if (row[0]) {
    return {
      ...row[0],
      madhhab: row[0].madhhab || "general",
      setupComplete: row[0].setupComplete !== false,
      trustedAckAt: row[0].trustedAckAt ?? null,
      metalsUpdatedAt: row[0].metalsUpdatedAt ?? null,
      hijriCalendar: row[0].hijriCalendar === "umalqura" ? "umalqura" : "tabular",
    };
  }
  return {
    userId,
    updatedAt: new Date().toISOString(),
    ...DEFAULT_SETTINGS,
  };
}
