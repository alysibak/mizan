import { readJson } from "@/lib/api";
import { isJourneyStep } from "@/lib/feedback";
import { addToJourney } from "@/lib/journey-store";
import { LIMITS, overLimit } from "@/lib/rate-limit";

/**
 * One more for a step of the main journey today. Only the step and the day
 * are kept: no address, no page details, nothing to tell visitors apart.
 * Always answers "done", so a page never shows an error for a count.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  if (await overLimit(request, LIMITS.journey)) return done;
  const body = (await readJson(request, 256)) as { step?: unknown } | null;
  if (body && isJourneyStep(body.step)) await addToJourney(body.step);
  return done;
}
