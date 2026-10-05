import { getCurrentUser, getUserSettings } from "@/lib/session";
import UdhiyahTool from "@/components/UdhiyahTool";

export default async function UdhiyahPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brassDeep">Seasonal</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Udhiyah / qurbani</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Split the cost of an animal into shares. This does not decide whether
          you are obligated, which animal qualifies, or local slaughter rules —
          only the arithmetic of a shared purchase.
        </p>
      </header>
      <UdhiyahTool currency={settings.currency} />
    </div>
  );
}
