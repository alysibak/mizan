import type { Settings, User } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { isDemoUser } from "@/lib/demo";
import DemoBanner from "@/components/DemoBanner";
import TimezoneSync from "@/components/TimezoneSync";
import Nav from "@/components/Nav";
import MobileHeader from "@/components/MobileHeader";
import MobileTabBar from "@/components/MobileTabBar";
import AppFooter from "@/components/AppFooter";

/**
 * The signed-in frame: sidebar, phone header and tab bar. The app's own pages
 * sit in it, and so do the about pages (privacy, terms, method, what is
 * verified) when a signed-in person opens them.
 */
export default function AppShell({
  user,
  settings,
  children,
}: {
  user: User;
  settings: Settings;
  children: React.ReactNode;
}) {
  const admin = isAdmin(user);
  const demo = isDemoUser(user);

  return (
    <div className="md:flex">
      {/* The shared demo is read-only, time zone included. */}
      {demo ? null : <TimezoneSync saved={settings.timezone} />}
      <div className="print:hidden">
        <Nav name={user.name} isAdmin={admin} />
      </div>
      <div className="flex min-h-[100dvh] w-full flex-col">
        <div className="print:hidden">
          <MobileHeader isAdmin={admin} />
        </div>
        <main className="flex-1 px-5 pb-28 pt-5 md:px-10 md:py-10 print:p-0">
          <div className="mx-auto max-w-3xl">
            {demo ? <DemoBanner /> : null}
            {children}
            <AppFooter />
          </div>
        </main>
        <div className="print:hidden">
          <MobileTabBar />
        </div>
      </div>
    </div>
  );
}
