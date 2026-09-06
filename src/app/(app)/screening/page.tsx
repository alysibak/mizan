import ScreeningTool from "@/components/ScreeningTool";
import EstimateBanner from "@/components/EstimateBanner";
import { getCurrentUser, getUserSettings } from "@/lib/session";

export default async function ScreeningPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Equity checks</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Shariah stock screening</h1>
        <p className="mt-2 text-sm text-sage">
          Apply AAOIFI-style business and ratio checks to figures you enter by
          hand. A pass means those checks cleared — not that the stock is
          recommended or that every scholar agrees.
        </p>
      </header>

      <EstimateBanner />

      <ScreeningTool currency={settings.currency} />
    </div>
  );
}
