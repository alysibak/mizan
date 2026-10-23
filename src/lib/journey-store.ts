import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { journeyCounts } from "@/db/schema";
import { countDay, type JourneyStep } from "@/lib/feedback";

/** One more for this step today. Only the step and the day are kept. */
export async function addToJourney(step: JourneyStep, at = new Date()): Promise<void> {
  await db
    .insert(journeyCounts)
    .values({ day: countDay(at), step, count: 1 })
    .onConflictDoUpdate({
      target: [journeyCounts.day, journeyCounts.step],
      set: { count: sql`${journeyCounts.count} + 1` },
    });
}
