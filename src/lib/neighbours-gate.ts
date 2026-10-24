import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { needs, partners, type Need, type Partner, type User } from "@/db/schema";
import { errorJson, signedInUser, writableUser } from "@/lib/api";
import { neighboursMode, roleIn } from "@/lib/neighbours-store";

type Gate =
  | { user: User; partner: Partner; role: "lead" | "member"; response?: undefined }
  | { response: Response; user?: undefined };

/** A member of this partner, able to change things; or the response to return. */
export async function partnerGate(partnerId: unknown): Promise<Gate> {
  if (neighboursMode() === "off") return { response: errorJson("Not found", 404) };
  const gate = await writableUser();
  if (gate.response) return { response: gate.response };
  if (typeof partnerId !== "string") return { response: errorJson("Not found", 404) };
  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) return { response: errorJson("Not found", 404) };
  const role = await roleIn(partner.id, gate.user.id);
  if (!role) return { response: errorJson("You are not part of this mosque on Mizan.", 403) };
  return { user: gate.user, partner, role };
}

/** A member of this partner, for reading only (the shared demo included). */
export async function partnerReadGate(partnerId: unknown): Promise<Gate> {
  if (neighboursMode() === "off") return { response: errorJson("Not found", 404) };
  const gate = await signedInUser();
  if (gate.response) return { response: gate.response };
  if (typeof partnerId !== "string") return { response: errorJson("Not found", 404) };
  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) return { response: errorJson("Not found", 404) };
  const role = await roleIn(partner.id, gate.user.id);
  if (!role) return { response: errorJson("You are not part of this mosque on Mizan.", 403) };
  return { user: gate.user, partner, role };
}

/** The need and its partner's member; or the response to return. */
export async function needGate(needId: string): Promise<(Gate & { need?: Need }) | { response: Response }> {
  if (!/^[0-9a-f-]{36}$/.test(needId)) return { response: errorJson("Not found", 404) };
  const [need] = await db.select().from(needs).where(eq(needs.id, needId)).limit(1);
  if (!need) return { response: errorJson("Not found", 404) };
  const gate = await partnerGate(need.partnerId);
  return gate.response ? gate : { ...gate, need };
}
