import { getCurrentUser, getUserSettings } from "@/lib/session";
import MirathTool from "@/components/MirathTool";

export default async function MirathPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Faraid</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Mirath</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Sunni shares of an estate, in exact fractions. This is an estimate —
          grandfather-with-siblings and several other cases differ by school.
          For a real estate, ask someone qualified.
        </p>
      </header>
      <MirathTool currency={settings.currency} />
    </div>
  );
}
