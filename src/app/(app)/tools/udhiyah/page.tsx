import { getCurrentUser, getUserSettings } from "@/lib/session";
import UdhiyahTool from "@/components/UdhiyahTool";

export default async function UdhiyahPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brassDeep">Eid al-Adha</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Qurbani (udhiyah)</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          Share the cost of an animal. This only does the sums: ask someone you
          trust whether you must give qurbani and which animal is right.
        </p>
      </header>
      <UdhiyahTool currency={settings.currency} />
    </div>
  );
}
