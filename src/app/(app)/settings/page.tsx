import Link from "next/link";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import SettingsForm from "@/components/SettingsForm";
import SignOutButton from "@/components/SignOutButton";
import DataBackup from "@/components/DataBackup";

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Setup</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Settings</h1>
      </header>

      <SettingsForm settings={settings} />
      <p className="text-sm text-sage">
        <Link href="/trust" className="text-pine hover:underline">
          How the numbers are made
        </Link>
        {settings.trustedAckAt ? (
          <span className="text-mist">
            {" "}
            · Trust note acknowledged{" "}
            {new Date(settings.trustedAckAt).toLocaleDateString()}
          </span>
        ) : null}
      </p>
      <DataBackup />
      <SignOutButton />
    </div>
  );
}
