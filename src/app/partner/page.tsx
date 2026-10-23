import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isDemoUser } from "@/lib/demo";
import { ensureExample, forgetOldContacts, membersOf, membershipsOf, partnerDesk } from "@/lib/neighbours-store";
import PartnerDesk from "@/components/neighbours/PartnerDesk";
import { ExampleBanner } from "@/components/neighbours/NeedBits";

export const dynamic = "force-dynamic";

/** Everything a mosque does on Neighbours, on one page. */
export default async function PartnerPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/partner");
  await ensureExample();
  await forgetOldContacts();
  const mine = await membershipsOf(user.id);
  if (!mine.length) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Mosque desk</h1>
        <p className="text-base text-ink">
          Your account is not part of a mosque on Mizan Neighbours yet. If your mosque would like to take part, read{" "}
          <Link href="/neighbours/for-mosques" className="text-pine underline underline-offset-2">
            what taking part means
          </Link>
          . If it already does, ask its lead to add you with the email you signed in with.
        </p>
      </div>
    );
  }
  const wanted = (await searchParams).p;
  const current = mine.find((m) => m.partner.slug === wanted) ?? mine[0];
  const [desk, members] = await Promise.all([partnerDesk(current.partner.id), membersOf(current.partner.id)]);
  const readOnly = isDemoUser(user);

  return (
    <div className="space-y-6">
      {current.partner.example ? <ExampleBanner /> : null}
      {mine.length > 1 ? (
        <nav aria-label="Your mosques" className="flex flex-wrap gap-2">
          {mine.map((m) => (
            <Link
              key={m.partner.id}
              href={`/partner?p=${m.partner.slug}`}
              aria-current={m.partner.id === current.partner.id ? "page" : undefined}
              className={m.partner.id === current.partner.id ? "btn-primary" : "btn-ghost"}
            >
              {m.partner.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <PartnerDesk
        partner={current.partner}
        role={current.role === "lead" ? "lead" : "member"}
        userId={user.id}
        readOnly={readOnly}
        desk={desk.map((d) => ({
          ...d,
          // What the desk needs from each promise: never more than the mosque needs to match a payment.
          pledges: d.pledges.map((p) => ({
            id: p.id,
            code: p.code,
            amount: p.amount,
            received: p.received,
            name: p.name,
            contact: p.contact,
            status: p.status,
            createdAt: p.createdAt,
          })),
        }))}
        members={members.map((m) => ({ userId: m.userId, name: m.name, email: m.email, role: m.role }))}
      />
    </div>
  );
}
