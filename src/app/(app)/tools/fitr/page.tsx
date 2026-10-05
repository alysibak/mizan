import { getCurrentUser, getUserSettings } from "@/lib/session";
import FitrTool from "@/components/FitrTool";

export default async function FitrPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brassDeep">End of Ramadan</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Zakat al-Fitr</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          A set amount for yourself and each person you provide for — children
          included — given before the Eid prayer. It is separate from zakat on
          wealth and does not reduce what you owe for the hawl.
        </p>
      </header>
      <FitrTool currency={settings.currency} />
    </div>
  );
}
