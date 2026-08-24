import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
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

  return (
    <div className="md:flex">
      <Nav name={user.name} />
      <div className="flex min-h-[100dvh] w-full flex-col">
        <MobileHeader />
        <main className="flex-1 px-5 pb-28 pt-5 md:px-10 md:py-10">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
