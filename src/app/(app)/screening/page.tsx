import ScreeningTool from "@/components/ScreeningTool";

export default function ScreeningPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Halal investing</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Shariah stock screening</h1>
        <p className="mt-2 text-sm text-sage">
          Check whether a company passes a business-activity screen and the
          AAOIFI financial ratios. Enter figures by hand, so nothing here depends
          on a paid data feed.
        </p>
      </header>

      <ScreeningTool />
    </div>
  );
}
