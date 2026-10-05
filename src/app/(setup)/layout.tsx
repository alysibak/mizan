import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import SignOutButton from "@/components/SignOutButton";
import TimezoneSync from "@/components/TimezoneSync";

// A private ledger is nobody's search result.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/begin");

  const settings = await getUserSettings(user.id);
  if (settings.setupComplete) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-6 py-8">
      <TimezoneSync saved={settings.timezone} />
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <Link href="/trust" className="font-serif text-2xl text-ink">
            Mizan
          </Link>
          <p className="mt-1 text-xs text-sage">Setup · {user.name}</p>
        </div>
        <SignOutButton
          className="text-xs text-sage hover:text-ink"
          label="Sign out"
          icon={false}
        />
      </div>
      <div className="mt-10 flex-1">{children}</div>
    </main>
  );
}
