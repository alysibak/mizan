import Link from "next/link";
import { redirect } from "next/navigation";
import { count, desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

const PAGE_SIZE = 100;

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  // SQLite CURRENT_TIMESTAMP has no zone marker but is UTC.
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me)) {
    redirect("/dashboard");
  }

  const requested = Number((await searchParams).page);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;

  const [[total], [active7], [active30], rows] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(users).where(gte(users.lastLoginAt, daysAgoIso(7))),
    db.select({ n: count() }).from(users).where(gte(users.lastLoginAt, daysAgoIso(30))),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const pages = Math.max(1, Math.ceil((total?.n ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brassDeep">Admin</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Who has entered</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Accounts that registered on Mizan, with when they signed up and when
          they last signed in (UTC). Only visible to you. Ledgers stay private:
          nothing here shows what anyone holds or gives.
        </p>
      </header>

      <dl className="grid gap-6 sm:grid-cols-3">
        {[
          ["Accounts", total?.n ?? 0],
          ["Signed in, last 7 days", active7?.n ?? 0],
          ["Signed in, last 30 days", active30?.n ?? 0],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="label">{label}</dt>
            <dd className="mt-1 font-serif text-2xl text-ink nums">
              {Number(value).toLocaleString("en")}
            </dd>
          </div>
        ))}
      </dl>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-mist px-4 py-3 text-sm text-sage">
          <span>
            Page {page} of {pages}
          </span>
          <span className="flex gap-4">
            {page > 1 ? (
              <Link href={`/admin/users?page=${page - 1}`} className="text-pine hover:underline">
                Newer
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={`/admin/users?page=${page + 1}`} className="text-pine hover:underline">
                Older
              </Link>
            ) : null}
          </span>
        </div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Accounts">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-mist bg-mist/30 text-xs uppercase tracking-wide text-sage">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Last signed in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-mist/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-sage">{u.email}</td>
                  <td className="px-4 py-3 text-sage nums">
                    {formatWhen(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sage nums">
                    {formatWhen(u.lastLoginAt)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sage"
                  >
                    No accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
