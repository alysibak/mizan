import { NextResponse } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/db";
import { partnerMembers, partners, users } from "@/db/schema";
import { errorJson, readJson, signedInUser } from "@/lib/api";
import { isAdmin } from "@/lib/admin";
import { cleanText, slugFor } from "@/lib/neighbours";

async function adminGate() {
  const gate = await signedInUser();
  if (gate.response) return gate;
  return isAdmin(gate.user) ? gate : { response: errorJson("Not found", 404) };
}

/** The operator adds a partner and its first lead, who must have a Mizan account. */
export async function POST(request: Request) {
  const gate = await adminGate();
  if (gate.response) return gate.response;
  const b = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const name = cleanText(b.name, 80).replace(/\n/g, " ");
  const city = cleanText(b.city, 60).replace(/\n/g, " ");
  const currency = typeof b.currency === "string" ? b.currency.trim().toUpperCase() : "";
  const email = typeof b.leadEmail === "string" ? b.leadEmail.trim().toLowerCase() : "";
  if (name.length < 2 || city.length < 2) return errorJson("Enter the name and the city.", 400);
  if (!/^[A-Z]{3}$/.test(currency)) return errorJson("Choose a currency.", 400);
  const [lead] = email ? await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1) : [];
  if (!lead) return errorJson("No Mizan account uses that email. Ask them to make one first.", 404);

  // A web address of its own: "masjid-al-noor", then "masjid-al-noor-2".
  const base = slugFor(`${name} ${city}`);
  const taken = new Set((await db.select({ slug: partners.slug }).from(partners).where(like(partners.slug, `${base}%`))).map((r) => r.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

  const [made] = await db.insert(partners).values({ slug, name, city, currency }).returning({ id: partners.id });
  await db.insert(partnerMembers).values({ partnerId: made.id, userId: lead.id, role: "lead" });
  return NextResponse.json({ id: made.id, slug }, { status: 201 });
}

/** Pause a partner (off every list at once) or let it go on. */
export async function PATCH(request: Request) {
  const gate = await adminGate();
  if (gate.response) return gate.response;
  const b = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  if (typeof b.id !== "string" || (b.status !== "active" && b.status !== "paused")) return errorJson("Not found", 404);
  await db.update(partners).set({ status: b.status }).where(eq(partners.id, b.id));
  return NextResponse.json({ ok: true });
}
