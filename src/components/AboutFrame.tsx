import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AppShell from "@/components/AppShell";
import { getCurrentUser, getUserSettings } from "@/lib/session";

/**
 * The frame for the about pages: the app's own sidebar and tab bar for someone
 * signed in, so privacy and the method read as part of their ledger; the
 * public header and footer for everyone else.
 */
export default async function AboutFrame({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) {
    const settings = await getUserSettings(user.id);
    if (settings.setupComplete) {
      return (
        <AppShell user={user} settings={settings}>
          <article>{children}</article>
        </AppShell>
      );
    }
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-20 pt-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
