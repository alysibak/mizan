import "server-only";
import { and, desc, eq, inArray, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  needEvents,
  needReports,
  needs,
  partnerMembers,
  partners,
  pledges,
  users,
  type Need,
  type Partner,
  type Pledge,
} from "@/db/schema";
import { emailEnabled, emailLink, sendEmail } from "@/lib/email";
import {
  CONTACT_KEEP_DAYS,
  daysLeft,
  expiryFrom,
  isListed,
  needProgress,
  needState,
  readNeighboursMode,
  readTime,
  sqlTime,
  type NeedProgress,
  type NeedState,
  type NeighboursMode,
} from "@/lib/neighbours";

export function neighboursMode(): NeighboursMode {
  return readNeighboursMode(process.env.NEIGHBOURS);
}

/** The partners shown: made-up ones in demo mode, real ones when on. */
function shownPartner(p: Pick<Partner, "status" | "example">, mode = neighboursMode()): boolean {
  return mode !== "off" && p.status === "active" && p.example === (mode === "demo");
}

export interface NeedView {
  need: Need;
  partner: Pick<Partner, "id" | "slug" | "name" | "city" | "currency" | "example">;
  progress: NeedProgress;
  state: NeedState;
  daysLeft: number | null;
}

/**
 * On the made-up example, visitors' own tries hold a place for half an hour
 * only, so the example never fills up; its own made-up promises always hold.
 */
function exampleHeld(held: Pick<Pledge, "code" | "amount" | "status" | "createdAt">[], now: Date) {
  return held
    .filter((p) => p.code.startsWith(EXAMPLE_CODE) || now.getTime() - readTime(p.createdAt).getTime() < 30 * 60_000)
    .map((p) => (p.code.startsWith(EXAMPLE_CODE) ? { ...p, createdAt: sqlTime(now) } : p));
}

function view(need: Need, partner: NeedView["partner"], held: Pick<Pledge, "code" | "amount" | "status" | "createdAt">[], now: Date): NeedView {
  const progress = needProgress(need, partner.example ? exampleHeld(held, now) : held, now);
  return { need, partner, progress, state: needState(need, progress, now), daysLeft: daysLeft(need.expiresAt, now) };
}

async function pledgesFor(needIds: string[]) {
  if (needIds.length === 0) return new Map<string, Pledge[]>();
  const rows = await db.select().from(pledges).where(inArray(pledges.needId, needIds)).orderBy(desc(pledges.createdAt));
  const by = new Map<string, Pledge[]>();
  for (const p of rows) by.set(p.needId, [...(by.get(p.needId) ?? []), p]);
  return by;
}

const PARTNER_COLUMNS = {
  id: partners.id,
  slug: partners.slug,
  name: partners.name,
  city: partners.city,
  currency: partners.currency,
  example: partners.example,
  status: partners.status,
};

/** Needs givers can see now, newest first; one partner's, or all shown partners'. */
export async function listedNeeds(opts: { partnerId?: string; zakatOnly?: boolean } = {}, now = new Date()): Promise<NeedView[]> {
  const rows = await db
    .select({ need: needs, partner: PARTNER_COLUMNS })
    .from(needs)
    .innerJoin(partners, eq(needs.partnerId, partners.id))
    .where(
      and(
        eq(needs.status, "open"),
        eq(needs.paused, false),
        opts.partnerId ? eq(needs.partnerId, opts.partnerId) : undefined,
        opts.zakatOnly ? eq(needs.zakat, true) : undefined,
      ),
    )
    .orderBy(desc(needs.publishedAt));
  const shown = rows.filter((r) => shownPartner(r.partner));
  const held = await pledgesFor(shown.map((r) => r.need.id));
  return shown
    .map((r) => view(r.need, r.partner, held.get(r.need.id) ?? [], now))
    .filter((v) => isListed(v.state));
}

/** One need for its public page: anything listed, met, ended or closed; never a draft or a removed one. */
export async function publicNeed(id: string, now = new Date()): Promise<NeedView | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db
    .select({ need: needs, partner: PARTNER_COLUMNS })
    .from(needs)
    .innerJoin(partners, eq(needs.partnerId, partners.id))
    .where(eq(needs.id, id))
    .limit(1);
  if (!row || !shownPartner(row.partner) || row.need.status === "draft" || row.need.status === "removed") return null;
  const held = await pledgesFor([id]);
  return view(row.need, row.partner, held.get(id) ?? [], now);
}

export async function partnerBySlug(slug: string): Promise<Partner | null> {
  const [p] = await db.select().from(partners).where(eq(partners.slug, slug)).limit(1);
  return p && shownPartner(p) ? p : null;
}

/** What a partner has done, for its page: needs met and money passed on this Gregorian year. */
export async function partnerTotals(partnerId: string, now = new Date()) {
  const from = `${now.getUTCFullYear()}-01-01`;
  const [row] = await db
    .select({
      met: sql<number>`sum(case when ${needs.received} >= ${needs.amount} then 1 else 0 end)`,
      passedOn: sql<number>`coalesce(sum(${needs.received}), 0)`,
    })
    .from(needs)
    .where(and(eq(needs.partnerId, partnerId), ne(needs.status, "draft"), ne(needs.status, "removed"), sql`${needs.createdAt} >= ${from}`));
  return { met: Number(row?.met ?? 0), passedOn: Number(row?.passedOn ?? 0) };
}

/** The partners this person helps run. */
export async function membershipsOf(userId: string) {
  return db
    .select({ partner: partners, role: partnerMembers.role })
    .from(partnerMembers)
    .innerJoin(partners, eq(partnerMembers.partnerId, partners.id))
    .where(eq(partnerMembers.userId, userId))
    .orderBy(partners.name);
}

export async function membersOf(partnerId: string) {
  return db
    .select({ userId: users.id, name: users.name, email: users.email, verified: users.emailVerifiedAt, role: partnerMembers.role })
    .from(partnerMembers)
    .innerJoin(users, eq(partnerMembers.userId, users.id))
    .where(eq(partnerMembers.partnerId, partnerId))
    .orderBy(users.name);
}

export async function roleIn(partnerId: string, userId: string): Promise<"lead" | "member" | null> {
  const [m] = await db
    .select({ role: partnerMembers.role })
    .from(partnerMembers)
    .where(and(eq(partnerMembers.partnerId, partnerId), eq(partnerMembers.userId, userId)))
    .limit(1);
  return m ? (m.role === "lead" ? "lead" : "member") : null;
}

export async function logEvent(needId: string, actor: string, action: string): Promise<void> {
  await db.insert(needEvents).values({ needId, actor, action });
}

/** Everything a partner's desk shows, with each need's pledges, reports and history. */
export async function partnerDesk(partnerId: string, now = new Date()) {
  const rows = await db
    .select()
    .from(needs)
    .where(and(eq(needs.partnerId, partnerId), ne(needs.status, "removed")))
    .orderBy(desc(needs.createdAt));
  const ids = rows.map((n) => n.id);
  const held = await pledgesFor(ids);
  const reports = ids.length
    ? await db.select().from(needReports).where(and(inArray(needReports.needId, ids), eq(needReports.status, "open")))
    : [];
  const events = ids.length
    ? await db.select().from(needEvents).where(inArray(needEvents.needId, ids)).orderBy(desc(needEvents.createdAt))
    : [];
  return rows.map((need) => {
    const ps = held.get(need.id) ?? [];
    const progress = needProgress(need, ps, now);
    return {
      need,
      progress,
      state: needState(need, progress, now),
      daysLeft: daysLeft(need.expiresAt, now),
      pledges: ps,
      reports: reports.filter((r) => r.needId === need.id),
      events: events.filter((e) => e.needId === need.id).slice(0, 6),
    };
  });
}

/**
 * A giver's name and contact are for matching a payment, not for keeping:
 * cleared once a pledge has been settled (or left to lapse) for some weeks.
 */
export async function forgetOldContacts(now = new Date()): Promise<void> {
  const before = sqlTime(new Date(now.getTime() - CONTACT_KEEP_DAYS * 86_400_000));
  await db
    .update(pledges)
    .set({ name: null, contact: null })
    .where(
      and(
        or(isNotNull(pledges.name), isNotNull(pledges.contact)),
        or(lt(pledges.receivedAt, before), and(ne(pledges.status, "received"), lt(pledges.createdAt, before))),
      ),
    );
}

/** A short plain-text note to every member with a confirmed address. */
export async function tellMembers(partnerId: string, subject: string, lines: string[]): Promise<void> {
  if (!emailEnabled()) return;
  const people = (await membersOf(partnerId)).filter((m) => m.verified);
  const text = [...lines, "", `Open your desk: ${emailLink("/partner")}`, "", "Mizan Neighbours"].join("\n");
  await Promise.all(people.map((m) => sendEmail({ to: m.email, subject, text }).catch(() => false)));
}

/** "It arrived" to a giver who left an email address. */
export async function tellGiver(contact: string | null, lines: string[]): Promise<void> {
  if (!contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || !emailEnabled()) return;
  await sendEmail({ to: contact, subject: "It arrived. May Allah reward you.", text: [...lines, "", "Mizan Neighbours"].join("\n") }).catch(
    () => false,
  );
}

const EXAMPLE_SLUG = "example-mosque";
/** The made-up promises' codes begin with this ("DEMO-K7P4"). */
const EXAMPLE_CODE = "DEMO";

/**
 * In demo mode, a made-up mosque with made-up needs, so partners can see how
 * it works before anything real is listed. Made once; the shared read-only
 * demo account can look at its desk.
 */
export async function ensureExample(now = new Date()): Promise<void> {
  if (neighboursMode() !== "demo") return;
  const [found] = await db.select({ id: partners.id }).from(partners).where(eq(partners.slug, EXAMPLE_SLUG)).limit(1);
  let partnerId = found?.id;
  if (!partnerId) {
    try {
      const [made] = await db
        .insert(partners)
        .values({
          slug: EXAMPLE_SLUG,
          name: "Example Mosque",
          city: "Your city",
          currency: "CAD",
          example: true,
          about:
            "An example, to show how Mizan Neighbours works: every need here is made up.\n\nOur needs committee meets each family in person and sees the papers: the rent letter, the bill, the prescription. Two members agree before a need is listed. Names, addresses and photos are never shown.",
          howToGive:
            "Example only. Pay Example Mosque by bank transfer (account 00-000 1234), or in cash at the office after Maghrib. Put your pledge code as the reference.",
          contact: "The mosque office, after Maghrib, Monday to Thursday",
        })
        .returning({ id: partners.id });
      partnerId = made.id;
    } catch {
      return; // made at the same moment by another request
    }
    const day = 86_400_000;
    const at = (daysAgo: number) => sqlTime(new Date(now.getTime() - daysAgo * day));
    const examples: (Partial<Need> & Pick<Need, "kind" | "title" | "amount" | "zakat">)[] = [
      {
        kind: "rent",
        title: "Rent for a mother of three, two months behind",
        story: "She works part-time since her husband left. The committee has seen the landlord's letter.",
        amount: 1800,
        received: 600,
        zakat: true,
      },
      {
        kind: "food",
        title: "Food for a family of five until the father's first pay",
        story: "He starts a new job next month. Until then there is very little food at home.",
        amount: 450,
        zakat: true,
      },
      {
        kind: "bills",
        title: "Heating bill for a widow before winter",
        story: "Her heating will be cut off at the end of the month.",
        amount: 520,
        received: 120,
        zakat: true,
      },
      {
        kind: "travel",
        title: "A student stranded after his money was stolen",
        story: "He needs a ticket home and food until he travels.",
        amount: 700,
        zakat: true,
      },
      {
        kind: "school",
        title: "School uniforms and books for two children",
        story: "The committee's scholar said this one is for general charity, not zakat.",
        amount: 300,
        received: 80,
        zakat: false,
      },
      {
        kind: "medical",
        title: "Medicine for an older man with diabetes, three months",
        story: "Met last week. Thank you to everyone who gave.",
        amount: 360,
        received: 360,
        zakat: true,
        status: "closed",
        thanks: "All of it arrived and the medicine is bought. Jazakum Allahu khayran.",
      },
    ];
    for (const [i, e] of examples.entries()) {
      const [n] = await db
        .insert(needs)
        .values({
          partnerId,
          status: "open",
          publishedAt: at(10 - i),
          expiresAt: expiryFrom(now, 30 - i * 4),
          closedAt: e.status === "closed" ? at(2) : null,
          ...e,
        })
        .returning({ id: needs.id, kind: needs.kind });
      await logEvent(n.id, "Example committee", "Listed it");
      // The stranded student is fully promised: the money is on its way.
      if (n.kind === "travel") {
        await db.insert(pledges).values({ needId: n.id, code: `${EXAMPLE_CODE}K7P${i + 2}`, amount: 700, createdAt: at(1) });
      }
      if (n.kind === "rent") {
        await db.insert(pledges).values({ needId: n.id, code: `${EXAMPLE_CODE}Q4M${i + 2}`, amount: 400, createdAt: at(1) });
      }
    }
  }
  // The shared demo account can open the example desk, read-only.
  const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
  if (demoEmail) {
    const [demo] = await db.select({ id: users.id }).from(users).where(eq(users.email, demoEmail)).limit(1);
    if (demo) {
      await db
        .insert(partnerMembers)
        .values({ partnerId, userId: demo.id, role: "lead" })
        .onConflictDoNothing();
    }
  }
}
