import Link from "next/link";
import ScreeningTool from "@/components/ScreeningTool";
import ToolPage, {
  toolMetadata,
  type ToolPageCopy,
} from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/halal-stocks",
  metaTitle: "Halal stock screener: shariah compliance checks",
  metaDescription:
    "Check whether a stock passes AAOIFI-style shariah screens: business activity, debt, cash and impermissible income ratios, with dividend purification. Free, no account.",
  appName: "Mizan halal stock screener",
  eyebrow: "Shariah equity screening",
  title: "Halal stock screener",
  lede: "Enter a company’s figures from its latest report and see whether it clears the commonly used business and financial screens, and how much of a dividend to purify.",
  sections: [
    {
      heading: "The two screens",
      body: (
        <>
          <p>
            <strong className="font-medium text-ink">Business.</strong> The
            company’s core business must be permissible: not alcohol, gambling,
            interest-based finance or insurance, pork, adult entertainment, and,
            for many screens, tobacco and weapons.
          </p>
          <p>
            <strong className="font-medium text-ink">Financial ratios.</strong>{" "}
            Following AAOIFI’s standard on shares: interest-bearing debt under
            30% of market capitalisation, cash and interest-bearing securities
            under 30%, and income from impermissible sources under 5% of
            revenue. Some index providers divide by total assets instead; you
            can switch the basis.
          </p>
        </>
      ),
    },
    {
      heading: "Purifying dividends",
      body: (
        <p>
          A company can pass with a small share of impermissible income, such as
          interest on its cash. Holders give away that share of each dividend,
          to charity and without expecting reward. This purification is not
          zakat and does not count toward it.
        </p>
      ),
    },
    {
      heading: "Zakat on shares",
      body: (
        <p>
          Shares you trade are zakatable at their full market value. Shares held
          long term for dividends are often assessed on the company’s zakatable
          assets, roughly a quarter to a third of the share price; the{" "}
          <Link href="/calculator" className="text-pine hover:underline">
            zakat calculator
          </Link>{" "}
          lets you set that portion.
        </p>
      ),
    },
    {
      heading: "What this is not",
      body: (
        <p>
          A starting point for your own research. It does not fetch financial
          data, so it is only as current as the figures you enter, and clearing
          these checks is not a fatwa or investment advice. Index providers (Dow
          Jones Islamic, S&amp;P Shariah, MSCI Islamic) use different cut-offs
          and can disagree about the same company.
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "Where do I find the figures?",
      a: "The company’s latest annual or quarterly report: the balance sheet gives total assets, debt, and cash; the income statement gives revenue and interest income. Market capitalisation is on any quote page. Many screeners use a trailing twelve- or twenty-four-month average of market cap.",
    },
    {
      q: "Why 30% and 5%?",
      a: "They are the thresholds in AAOIFI’s Shari‘ah Standard No. 21 on financial papers, which most Islamic indices and funds follow or adapt. They are tolerances for an imperfect market, not a statement that some interest is acceptable.",
    },
    {
      q: "Are index funds and ETFs halal?",
      a: "A conventional index fund holds every company in the index, including banks and brewers, so it does not pass. Shariah-screened ETFs apply checks like these to every holding and purify income for you.",
    },
    {
      q: "Is my data saved?",
      a: "The form is kept in this browser so you can come back to it. Nothing is sent to a server.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function HalalStocksPage() {
  return (
    <ToolPage copy={copy}>
      <ScreeningTool />
    </ToolPage>
  );
}
