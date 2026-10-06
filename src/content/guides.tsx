import Link from "next/link";
import type { ToolPageCopy } from "@/components/public/ToolPage";

// Short guides to the questions people search for. Each states the common
// position, names where the schools differ, and ends in the calculator.
// Rulings here must match what the calculator and /method do.

export interface Guide extends ToolPageCopy {
  slug: string;
  /** Link text in lists of guides. */
  short: string;
}

const UPDATED = "2026-10-06";

const calc = (text = "the zakat calculator") => (
  <Link href="/calculator" className="text-pine hover:underline">
    {text}
  </Link>
);

export const GUIDES: Guide[] = [
  {
    slug: "zakat-on-gold",
    short: "Gold and silver",
    path: "/guides/zakat-on-gold",
    kind: "guide",
    updated: UPDATED,
    metaTitle: "Zakat on gold and silver: nisab, karats and jewellery",
    metaDescription:
      "How zakat on gold and silver works: the 85 g and 595 g nisab, working out pure gold by karat, and how the schools differ on jewellery you wear.",
    appName: "Zakat on gold and silver",
    eyebrow: "Guide",
    title: "Zakat on gold and silver",
    lede: "Gold and silver you have held for a lunar year are zakatable at 2.5% of their value, once your wealth reaches nisab. The questions are how much counts as pure metal, and whether the jewellery you wear counts at all.",
    sections: [
      {
        heading: "The thresholds",
        body: (
          <>
            <p>
              Nisab for gold is 85 grams (20 mithqal); for silver it is 595 grams (200
              dirhams). Because silver is far cheaper, its nisab is a much lower amount of
              money, and many scholars recommend it for cash and mixed wealth because more
              people then pay and more reaches the poor. See{" "}
              <Link href="/nisab" className="text-pine hover:underline">
                today’s nisab in your currency
              </Link>
              .
            </p>
          </>
        ),
      },
      {
        heading: "Pure metal, by karat",
        body: (
          <>
            <p>
              Zakat is on the gold or silver itself, so most people count the pure content:
              weight × fineness. 24 karat is pure; 22 karat is about 91.7% gold, 21 karat
              87.5%, 18 karat 75%, 14 karat 58.5%. Sterling silver is 92.5%. A 40 g
              bracelet in 18 karat holds 30 g of gold.
            </p>
            <p>
              Value it at today’s price per gram of pure metal, not what you paid and not a
              jeweller’s retail price with making charges. Stones and settings are not gold.
            </p>
          </>
        ),
      },
      {
        heading: "Jewellery you wear",
        body: (
          <>
            <p>
              The Hanafi school counts all gold and silver, worn or not. The Maliki, Shafi‘i
              and Hanbali schools exempt jewellery that is permitted and worn in the usual
              way, and count jewellery kept as savings, for investment, or far beyond what
              is customary. Many who follow the majority view still pay on worn jewellery as
              a precaution.
            </p>
            <p>
              Coins, bars, and jewellery held as savings are zakatable in every school.
            </p>
          </>
        ),
      },
      {
        heading: "Working it out",
        body: (
          <p>
            Add the value of your gold and silver to your other zakatable wealth (cash,
            savings, trade goods, shares), take off debts due now, and if the total is at or
            above nisab on your zakat day, 2.5% of it is due. {calc("The calculator")} takes
            metal by weight and karat and lets you choose how worn jewellery is treated.
          </p>
        ),
      },
    ],
    faq: [
      {
        q: "Do I pay zakat on my wedding jewellery?",
        a: "In the Hanafi school, yes, if your zakatable wealth reaches nisab. In the Maliki, Shafi‘i and Hanbali schools, jewellery worn in the usual way is exempt, but jewellery kept as savings is not. Follow the school or scholar you rely on.",
      },
      {
        q: "Is zakat on gold based on the purchase price?",
        a: "No. It is based on the value of the pure gold on your zakat day, at the current market price per gram.",
      },
      {
        q: "Do I add gold and silver together to reach nisab?",
        a: "The Hanafi and Maliki schools add them together (with cash) to reach nisab; the Shafi‘i school does not add gold to silver. Most people simply add all zakatable wealth and compare it to the silver or gold nisab they follow.",
      },
    ],
  },
  {
    slug: "zakat-on-savings",
    short: "Cash and savings",
    path: "/guides/zakat-on-savings",
    kind: "guide",
    updated: UPDATED,
    metaTitle: "Zakat on savings and cash: bank accounts, interest and debts",
    metaDescription:
      "Zakat on cash, bank accounts and foreign currency: what counts, what to do with interest, which debts you can take off, and how the hawl works.",
    appName: "Zakat on savings and cash",
    eyebrow: "Guide",
    title: "Zakat on savings and cash",
    lede: "Cash at home, current and savings accounts, money in apps, and foreign currency all count. Zakat is 2.5% of what you hold on your zakat day, once your wealth has stayed above nisab for a lunar year.",
    sections: [
      {
        heading: "What counts",
        body: (
          <p>
            Every balance you own and can reach: cash, bank and savings accounts, fixed
            deposits, money in payment apps, and foreign currency at today’s rate. Money set
            aside for a purchase you have not made yet still counts if you hold it on your
            zakat day. Money owed to you that you expect to be repaid is also usually
            counted.
          </p>
        ),
      },
      {
        heading: "The year: hawl",
        body: (
          <p>
            Zakat falls due when your wealth has stayed at or above nisab for one lunar year
            (about 354 days). Most people do not track each deposit: they pick the date their
            wealth first reached nisab, and every year on that date they count whatever they
            hold. Money that arrived last week is counted with the rest. If you keep the
            Gregorian year instead, the rate becomes about 2.577% to make up for the longer
            year.
          </p>
        ),
      },
      {
        heading: "Interest",
        body: (
          <p>
            Interest earned is not yours to keep. Give it away to good causes without
            expecting reward, and do not count it as zakat or include it in your zakatable
            wealth. Your own deposits still count.
          </p>
        ),
      },
      {
        heading: "Debts you owe",
        body: (
          <p>
            Most scholars let you take off debts that are due now: a bill, a loan instalment
            that is due, money you must repay soon. For long loans such as a mortgage, many
            deduct only the payments due in the coming year, not the whole balance. The
            Shafi‘i school, in its main view, does not deduct debts at all. {calc("The calculator")}{" "}
            only subtracts the debts you mark as due.
          </p>
        ),
      },
    ],
    faq: [
      {
        q: "Do I pay zakat on my emergency fund?",
        a: "Yes. Savings set aside for emergencies are still yours on your zakat day, so they count.",
      },
      {
        q: "What if my balance dropped below nisab during the year?",
        a: "In the Hanafi school, only the start and end of the year matter, as long as you still had some wealth in between. In the other schools, falling below nisab breaks the year and it starts again when you are back above it.",
      },
      {
        q: "Do I pay zakat on money I am saving for a house or wedding?",
        a: "Yes, if you still hold it on your zakat day. Zakat is on what you own, whatever you plan to spend it on later.",
      },
    ],
  },
  {
    slug: "zakat-on-shares",
    short: "Shares and funds",
    path: "/guides/zakat-on-shares",
    kind: "guide",
    updated: UPDATED,
    metaTitle: "Zakat on shares, stocks, ETFs and index funds",
    metaDescription:
      "How to work out zakat on shares: full market value for trading, the company's zakatable assets for long-term holdings, and the common 25% estimate.",
    appName: "Zakat on shares and funds",
    eyebrow: "Guide",
    title: "Zakat on shares and funds",
    lede: "How much of a share is zakatable depends on why you hold it. Shares you trade count at full value; shares you keep for the long term are often assessed on the part of the company that is itself zakatable.",
    sections: [
      {
        heading: "Shares you trade",
        body: (
          <p>
            Shares bought to sell for a profit are trade goods. Count their full market value
            on your zakat day, and pay 2.5% of it with the rest of your wealth.
          </p>
        ),
      },
      {
        heading: "Shares you hold for the long term",
        body: (
          <>
            <p>
              Shares kept for dividends and growth are a part-ownership of a business. A
              widely used approach, including in AAOIFI’s standard on zakat, assesses your
              share of the company’s zakatable assets (its cash, receivables, and
              inventory), not its buildings and machinery.
            </p>
            <p>
              That figure is hard to find for every holding, so many people use an estimate:
              around 25% to 30% of the market value is commonly cited. Mizan starts at 25%
              and lets you change it. Some scholars instead count the full value of every
              share, which is the cautious choice.
            </p>
          </>
        ),
      },
      {
        heading: "Funds, ETFs and robo-advisers",
        body: (
          <p>
            A fund is a basket of shares, so the same two cases apply: full value if you
            trade it, the zakatable portion if you hold it. A money-market or bond fund is
            closer to cash and is usually counted in full.
          </p>
        ),
      },
      {
        heading: "Halal holdings and purification",
        body: (
          <p>
            Zakat is separate from whether a share is permissible to hold, and from giving
            away the impermissible part of its dividends. The{" "}
            <Link href="/halal-stocks" className="text-pine hover:underline">
              halal stock screen
            </Link>{" "}
            covers both. {calc("The calculator")} handles the zakat.
          </p>
        ),
      },
    ],
    faq: [
      {
        q: "Do I pay zakat on my whole portfolio?",
        a: "On anything you trade, yes, at full market value. On long-term holdings, many scholars assess only the company’s zakatable assets, often estimated at about a quarter of the value. Paying on the full value is the cautious choice.",
      },
      {
        q: "If the company pays zakat, do I still pay?",
        a: "Some companies, mostly in Muslim-majority countries, pay zakat on their assets. Many scholars hold that this covers shareholders who hold for the long term. Most listed companies elsewhere do not pay zakat.",
      },
      {
        q: "What about unvested employee shares?",
        a: "Shares you do not yet own are not zakatable. Count them once they vest and are yours.",
      },
    ],
  },
  {
    slug: "zakat-on-crypto",
    short: "Cryptocurrency",
    path: "/guides/zakat-on-crypto",
    kind: "guide",
    updated: UPDATED,
    metaTitle: "Zakat on cryptocurrency: Bitcoin, stablecoins and staking",
    metaDescription:
      "Zakat on crypto: most scholars who allow holding it count it at market value like cash or trade goods. Stablecoins, staking, and how to value it on your zakat day.",
    appName: "Zakat on cryptocurrency",
    eyebrow: "Guide",
    title: "Zakat on cryptocurrency",
    lede: "Scholars who consider holding cryptocurrency permissible generally treat it as wealth: count its market value on your zakat day with your other assets, and pay 2.5% if the total reaches nisab.",
    sections: [
      {
        heading: "How it is counted",
        body: (
          <p>
            Whether you see a coin as a currency or as something held to sell, the result is
            the same: its market value in your own currency on your zakat day is added to
            your zakatable wealth. Use the price at that time, not what you paid.
          </p>
        ),
      },
      {
        heading: "Stablecoins, staking, and locked tokens",
        body: (
          <>
            <p>
              Stablecoins count like the currency they track. Staked or lent coins are still
              yours and still count, and the rewards you have received count too. Tokens you
              cannot yet reach, such as unvested allocations, are counted once they are yours
              to move.
            </p>
            <p>
              NFTs and tokens bought to resell are trade goods, counted at what they would
              sell for. Ones kept for personal use are not.
            </p>
          </>
        ),
      },
      {
        heading: "Whether it is permissible",
        body: (
          <p>
            Scholars disagree about whether cryptocurrency may be held at all, and about
            particular coins and lending products. Mizan does not decide that. If you hold it,
            it is part of your wealth for zakat. Add it to {calc()} as cash.
          </p>
        ),
      },
    ],
    faq: [
      {
        q: "Do I pay zakat on crypto that has lost value?",
        a: "Zakat is on what you hold on your zakat day, at that day’s value. A loss since you bought it lowers what you count; it is not deducted separately.",
      },
      {
        q: "Is mining equipment zakatable?",
        a: "No. Equipment used to earn income is not zakatable. The coins it produces are, once you hold them.",
      },
    ],
  },
  {
    slug: "zakat-on-pensions",
    short: "Pensions and retirement",
    path: "/guides/zakat-on-pensions",
    kind: "guide",
    updated: UPDATED,
    metaTitle: "Zakat on pensions, 401(k), RRSP and superannuation",
    metaDescription:
      "Zakat on retirement savings: defined-benefit pensions, and the three common views on 401(k), RRSP, ISA, superannuation and workplace pension accounts.",
    appName: "Zakat on pensions",
    eyebrow: "Guide",
    title: "Zakat on pensions and retirement accounts",
    lede: "Scholars differ more on pensions than on most assets, because the money is yours but often out of reach. What you can reach, and what the account is invested in, decide which view fits.",
    sections: [
      {
        heading: "Defined-benefit pensions",
        body: (
          <p>
            A pension that promises a fixed income from your employer, with no pot you own
            or can withdraw, is generally not zakatable until you are paid. The payments then
            join your other wealth.
          </p>
        ),
      },
      {
        heading: "Accounts you own: three common views",
        body: (
          <>
            <p>
              For accounts such as a 401(k), IRA, RRSP, workplace pension pot, or
              superannuation, three views are widely held:
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>
                Pay each year on what you could withdraw today, after the early-withdrawal
                penalty and tax.
              </li>
              <li>
                Pay each year on the zakatable part of what the account holds, as with
                long-term shares (often estimated at about a quarter of the value).
              </li>
              <li>
                Pay nothing until you can reach the money, then pay on what you receive.
              </li>
            </ul>
            <p>
              Accounts you can withdraw from freely, such as an ISA or a TFSA, are treated
              like ordinary savings or investments.
            </p>
          </>
        ),
      },
      {
        heading: "In the calculator",
        body: (
          <p>
            {calc("The calculator")} lets you enter a pension with the portion you count,
            so it fits whichever view you follow. Whichever you choose, use it every year.
          </p>
        ),
      },
    ],
    faq: [
      {
        q: "Which view should I follow on my 401(k) or workplace pension?",
        a: "Ask a scholar you trust, ideally one familiar with how pensions work where you live. Paying on the amount you could withdraw after penalties and tax is a common middle course.",
      },
      {
        q: "Do employer contributions count?",
        a: "Only once they are yours. Unvested employer contributions are not counted.",
      },
    ],
  },
  {
    slug: "zakat-on-property",
    short: "Property and rent",
    path: "/guides/zakat-on-property",
    kind: "guide",
    updated: UPDATED,
    metaTitle: "Zakat on property: your home, rental income and land",
    metaDescription:
      "No zakat on the home you live in. Rental property is not zakatable by value but its saved income is; property bought to resell counts at market value.",
    appName: "Zakat on property",
    eyebrow: "Guide",
    title: "Zakat on property",
    lede: "Whether property is zakatable depends on what you use it for. The home you live in is never zakatable. Property held to resell counts at its market value.",
    sections: [
      {
        heading: "Your home",
        body: (
          <p>
            The home you live in, like your car and furniture, is for personal use and is
            not zakatable, whatever it is worth.
          </p>
        ),
      },
      {
        heading: "Rental property",
        body: (
          <p>
            A property you let out is a source of income, not a stock of wealth, so its value
            is not zakatable. The rent you have saved is: it joins your cash on your zakat
            day.
          </p>
        ),
      },
      {
        heading: "Property and land to resell",
        body: (
          <p>
            Property bought with the intention of selling it, such as a renovation to sell
            or land held for resale, is trade goods. Count its market value each year. If
            you are undecided whether to sell, many scholars do not count it until you
            decide to.
          </p>
        ),
      },
      {
        heading: "Mortgages",
        body: (
          <p>
            Many scholars let you deduct the mortgage payments due in the coming year from
            your zakatable wealth, but not the whole balance. Enter those in{" "}
            {calc("the calculator")} as a debt due now.
          </p>
        ),
      },
    ],
    faq: [
      {
        q: "Do I pay zakat on a second home I do not rent out?",
        a: "Not if it is for your own use. If you bought it to sell, it is trade goods and counts at market value.",
      },
      {
        q: "Do I pay zakat on rent as soon as I receive it?",
        a: "No separate year is needed for it: rent you still hold on your zakat day is counted with your other cash.",
      },
    ],
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
