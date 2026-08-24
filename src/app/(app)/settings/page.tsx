import { getCurrentUser, getUserSettings } from "@/lib/session";
import SettingsForm from "@/components/SettingsForm";
import SignOutButton from "@/components/SignOutButton";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const { welcome } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Setup</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Settings</h1>
      </header>

      {welcome && (
        <div className="card border-pine/30 bg-pine/5 p-5">
          <p className="font-serif text-lg text-ink">Welcome to Mizan.</p>
          <p className="mt-1 text-sm text-sage">
            Before you calculate, set your currency, pick a nisab standard, and
            enter current gold and silver prices. You can change these any time.
          </p>
        </div>
      )}

      <SettingsForm settings={settings} />
      <SignOutButton />
    </div>
  );
}
