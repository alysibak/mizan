import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { needs, partnerMembers, partners, users } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { cleanText } from "@/lib/neighbours";
import { partnerGate } from "@/lib/neighbours-gate";

type Params = { params: Promise<{ id: string }> };

/** The lead changes how the partner presents itself and how needs are checked. */
export async function PATCH(request: Request, { params }: Params) {
  const gate = await partnerGate((await params).id);
  if (gate.response) return gate.response;
  if (gate.role !== "lead") return errorJson("Only the lead can change these.", 403);
  const b = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const name = cleanText(b.name, 80).replace(/\n/g, " ");
  const city = cleanText(b.city, 60).replace(/\n/g, " ");
  const currency = typeof b.currency === "string" ? b.currency.trim().toUpperCase() : "";
  if (name.length < 2 || city.length < 2) return errorJson("Enter the name and the city.", 400);
  if (!/^[A-Z]{3}$/.test(currency)) return errorJson("Choose a currency.", 400);
  if (currency !== gate.partner.currency) {
    const [written] = await db.select({ n: count() }).from(needs).where(eq(needs.partnerId, gate.partner.id));
    if ((written?.n ?? 0) > 0) {
      return errorJson("The currency cannot change once needs are written: their amounts are in it.", 409);
    }
  }
  await db
    .update(partners)
    .set({
      name,
      city,
      currency,
      about: cleanText(b.about, 1200),
      howToGive: cleanText(b.howToGive, 600),
      contact: cleanText(b.contact, 120).replace(/\n/g, " "),
      twoPerson: b.twoPerson !== false,
    })
    .where(eq(partners.id, gate.partner.id));
  return NextResponse.json({ ok: true });
}

/** The lead adds someone with a Mizan account to the partner's desk. */
export async function POST(request: Request, { params }: Params) {
  const gate = await partnerGate((await params).id);
  if (gate.response) return gate.response;
  if (gate.role !== "lead") return errorJson("Only the lead can add people.", 403);
  const b = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const [person] = email ? await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1) : [];
  if (!person) return errorJson("No Mizan account uses that email. Ask them to make one first.", 404);
  await db.insert(partnerMembers).values({ partnerId: gate.partner.id, userId: person.id, role: "member" }).onConflictDoNothing();
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** The lead takes someone off the desk; the last lead cannot leave. */
export async function DELETE(request: Request, { params }: Params) {
  const gate = await partnerGate((await params).id);
  if (gate.response) return gate.response;
  if (gate.role !== "lead") return errorJson("Only the lead can remove people.", 403);
  const b = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  if (typeof b.userId !== "string") return errorJson("Not found", 404);
  if (b.userId === gate.user.id) {
    const [leads] = await db
      .select({ n: count() })
      .from(partnerMembers)
      .where(and(eq(partnerMembers.partnerId, gate.partner.id), eq(partnerMembers.role, "lead")));
    if ((leads?.n ?? 0) <= 1) return errorJson("You are the only lead. Make someone else lead first.", 409);
  }
  await db
    .delete(partnerMembers)
    .where(and(eq(partnerMembers.partnerId, gate.partner.id), eq(partnerMembers.userId, b.userId)));
  return NextResponse.json({ ok: true });
}
