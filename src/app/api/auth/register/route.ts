import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, settings } from "@/db/schema";
import { firstIssue, registerSchema } from "@/lib/validation";
import { hashPassword, createSession } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/session";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

const TAKEN = "An account with this email already exists";

function isUniqueViolation(err: unknown): boolean {
  const text = String((err as { message?: string })?.message ?? err);
  return /UNIQUE constraint failed/i.test(text);
}

export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.register)) return tooManyRequests(LIMITS.register);
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: TAKEN }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const now = new Date().toISOString();

  // User and settings land together or not at all.
  try {
    await db.batch([
      db.insert(users).values({ id: userId, email, name, passwordHash, lastLoginAt: now }),
      db.insert(settings).values({
        userId,
        ...DEFAULT_SETTINGS,
        setupComplete: false,
      }),
    ]);
  } catch (err) {
    // Two sign-ups for the same email can both pass the check above.
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: TAKEN }, { status: 409 });
    }
    throw err;
  }

  await createSession(userId);
  return NextResponse.json({ ok: true });
}
