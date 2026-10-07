import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import AppShell from "@/components/AppShell";

// A private ledger is nobody's search result.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    const store = await cookies();
    if (store.get(SESSION_COOKIE)?.value) {
      redirect("/api/auth/clear-stale");
    }
    redirect("/login");
  }

  const settings = await getUserSettings(user.id);
  if (!settings.setupComplete) redirect("/begin");

  return (
    <AppShell user={user} settings={settings}>
      {children}
    </AppShell>
  );
}
