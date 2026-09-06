import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me)) {
    redirect("/dashboard");
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brass">Admin</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Who has entered</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Accounts that registered on Mizan, with when they signed up and when
          they last signed in. Only visible to you.
        </p>
      </header>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-mist px-4 py-3 text-sm text-sage">
          {rows.length} account{rows.length === 1 ? "" : "s"}
        </div>
        <div className="overflow-x-auto">
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
