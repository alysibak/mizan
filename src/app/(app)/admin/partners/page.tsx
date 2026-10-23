import Link from "next/link";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { needs, partnerMembers, partners } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { neighboursMode } from "@/lib/neighbours-store";
import AdminPartners from "@/components/neighbours/AdminPartners";
import AdminTabs from "../AdminTabs";

export const dynamic = "force-dynamic";

/** The operator's list of Neighbours partners: add one, pause one, see how busy each is. */
export default async function AdminPartnersPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me)) redirect("/dashboard");
  const mode = neighboursMode();
  const [rows, memberCounts, needCounts] = await Promise.all([
    db.select().from(partners).orderBy(partners.name),
    db.select({ id: partnerMembers.partnerId, n: count() }).from(partnerMembers).groupBy(partnerMembers.partnerId),
    db.select({ id: needs.partnerId, n: count() }).from(needs).where(eq(needs.status, "open")).groupBy(needs.partnerId),
  ]);
  const members = new Map(memberCounts.map((r) => [r.id, r.n]));
  const listed = new Map(needCounts.map((r) => [r.id, r.n]));

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Mosques on Neighbours</h1>
        <AdminTabs current="/admin/partners" />
        <p className="max-w-xl text-base text-sage">
          {mode === "off"
            ? "Neighbours is off. Set NEIGHBOURS=demo to show the made-up example, or NEIGHBOURS=on to show real partners."
            : mode === "demo"
              ? "Neighbours shows the made-up example only (NEIGHBOURS=demo). Real partners can be set up here and shown with NEIGHBOURS=on."
              : "Neighbours is on: real partners are shown."}{" "}
          <Link href="/neighbours/for-mosques" className="text-pine underline underline-offset-2">
            What partners agree to
          </Link>
        </p>
      </header>
      <AdminPartners
        partners={rows
          .filter((p) => !p.example)
          .map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            slug: p.slug,
            status: p.status,
            members: members.get(p.id) ?? 0,
            listed: listed.get(p.id) ?? 0,
          }))}
      />
    </div>
  );
}
