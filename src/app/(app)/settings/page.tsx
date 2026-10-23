import Link from "next/link";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import SettingsForm from "@/components/SettingsForm";
import SignOutButton from "@/components/SignOutButton";
import DataBackup from "@/components/DataBackup";
import CalendarFeed from "@/components/CalendarFeed";
import AccountPanel from "@/components/AccountPanel";
import SettingsGroup from "@/components/SettingsGroup";
import OpenFromHash from "@/components/OpenFromHash";
import { emailEnabled } from "@/lib/email";
import { hasPassword } from "@/lib/api";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ recovered?: string; email?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { recovered, email } = await searchParams;
  const settings = await getUserSettings(user.id);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Settings</h1>
      {/* A link to /settings#part opens that part. */}
      <OpenFromHash />

      <div>
        <SettingsForm settings={{ ...settings, calendarTokenHash: null }} />
        <SettingsGroup
          id="reminders"
          title="Reminders and backup"
          now="Your calendar, and a copy of your figures"
        >
          <CalendarFeed enabled={Boolean(settings.calendarTokenHash)} />
          <DataBackup />
        </SettingsGroup>
        <SettingsGroup
          id="account"
          title="Account"
          now={user.email}
          // Back from a recovery code or an email link: what happened is in here.
          open={Boolean(recovered || email)}
        >
          <AccountPanel
            email={user.email}
            hasPassword={hasPassword(user)}
            hasRecoveryCode={Boolean(user.recoveryCodeHash)}
            recovered={recovered === "1" || recovered === "2fa"}
            twoFactorTurnedOff={recovered === "2fa"}
            twoFactor={Boolean(user.totpSecret)}
            mail={
              emailEnabled()
                ? {
                    verified: Boolean(user.emailVerifiedAt),
                    reminders: settings.emailReminders,
                    status:
                      email === "confirmed" || email === "expired"
                        ? email
                        : null,
                  }
                : null
            }
          />
        </SettingsGroup>
      </div>
      <p className="text-base">
        <Link
          href="/method"
          className="inline-flex min-h-[44px] items-center text-pine hover:underline"
        >
          How Mizan works it out
        </Link>
      </p>
      <SignOutButton />
    </div>
  );
}
