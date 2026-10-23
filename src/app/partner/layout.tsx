import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { neighboursMode } from "@/lib/neighbours-store";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Mosque desk", robots: { index: false, follow: false } };

/**
 * A mosque's desk on Mizan Neighbours. Any signed-in member can open it; it
 * does not ask them to set up their own zakat first.
 */
export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  if (neighboursMode() === "off") notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/partner");
  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-mist bg-porcelain/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-2 md:px-10">
          <Link href="/" className="inline-flex min-h-[44px] items-center font-serif text-2xl tracking-tight text-ink">
            Mizan
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-pine hover:underline">
              My account
            </Link>
            <SignOutButton className="inline-flex min-h-[44px] items-center text-sage hover:text-ink" label="Sign out" icon={false} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10">{children}</main>
    </div>
  );
}
