import Link from "next/link";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import SettingsForm from "@/components/SettingsForm";
import SignOutButton from "@/components/SignOutButton";
import DataBackup from "@/components/DataBackup";
import CalendarFeed from "@/components/CalendarFeed";
import AccountPanel from "@/components/AccountPanel";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ recovered?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { recovered } = await searchParams;
  const settings = await getUserSettings(user.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brassDeep">Setup</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Settings</h1>
      </header>

      <SettingsForm settings={{ ...settings, calendarTokenHash: null }} />
      <p className="text-sm text-sage">
        <Link href="/trust" className="text-pine hover:underline">
          How the numbers are made
        </Link>
        {settings.trustedAckAt ? (
          <span className="text-sage">
            {" "}
            · Trust note acknowledged {settings.trustedAckAt.slice(0, 10)}
          </span>
        ) : null}
      </p>
      <CalendarFeed enabled={Boolean(settings.calendarTokenHash)} />
      <DataBackup />
      <AccountPanel
        email={user.email}
        hasRecoveryCode={Boolean(user.recoveryCodeHash)}
        recovered={recovered === "1"}
      />
      <SignOutButton />
    </div>
  );
}
