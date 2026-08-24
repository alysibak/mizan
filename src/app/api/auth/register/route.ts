import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, settings } from "@/db/schema";
import { registerSchema } from "@/lib/validation";
import { hashPassword, createSession } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning({ id: users.id });

  // Seed a settings row so the user lands on sensible defaults.
  await db.insert(settings).values({ userId: user.id, ...DEFAULT_SETTINGS });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
