import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import Nav from "@/components/Nav";
import MobileHeader from "@/components/MobileHeader";
import MobileTabBar from "@/components/MobileTabBar";

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

  const admin = isAdmin(user);

  return (
    <div className="md:flex">
      <div className="print:hidden">
        <Nav name={user.name} isAdmin={admin} />
      </div>
      <div className="flex min-h-[100dvh] w-full flex-col">
        <div className="print:hidden">
          <MobileHeader isAdmin={admin} />
        </div>
        <main className="flex-1 px-5 pb-28 pt-5 md:px-10 md:py-10 print:p-0">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
        <div className="print:hidden">
          <MobileTabBar />
        </div>
      </div>
    </div>
  );
}
