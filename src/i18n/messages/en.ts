// The English text of the public pages, and the shape every translation
// must match (see ./index.ts). Placeholders like {amount} are filled with
// `fmt` from ../config.

const en = {
  common: {
    nav: {
      calculator: "Calculator",
      method: "Method",
      signIn: "Sign in",
      openLedger: "Open a ledger",
      yourLedger: "Your ledger",
    },
    footer: {
      disclaimer:
        "A personal estimation aid, not a substitute for scholarly guidance. For your situation, consult a qualified person of knowledge.",
      calculator: "Zakat calculator",
      nisab: "Nisab today",
      toolsHeading: "Free tools",
      aboutHeading: "About",
      inheritance: "Inheritance calculator",
      fitr: "Zakat al-Fitr",
      stocks: "Halal stock screen",
      qurbani: "Qurbani shares",
      guides: "Zakat guides",
      method: "How the numbers are made",
      trust: "What is verified",
      privacy: "Privacy",
      terms: "Terms",
      languages: "Read Mizan in",
    },
    /** Appended to links that lead to pages only in English. */
    inEnglish: "",
    share: { button: "Share", whatsapp: "WhatsApp", copy: "Copy link", copied: "Link copied" },
  },

  landing: {
    metaTitle: "Mizan: free zakat calculator and ledger",
    metaDescription:
      "A free, private zakat calculator and ledger. Weigh your wealth against nisab, track the hawl on the Hijri calendar, record zakat and sadaqah, and close each year with a clear statement.",
    eyebrow: "الميزان · the balance",
    title: "Zakat, worked out with care.",
    lede: "A free, private zakat calculator and ledger. Weigh what you hold against nisab with live metal prices, keep your hawl on the Hijri calendar, and close each year with a figure you can trust.",
    ctaCalculate: "Calculate your zakat",
    ctaLedger: "Open a free ledger",
    trustLine: "Free · No ads · No bank linking · Export or delete your data at any time",
    sample: {
      aria: "An example zakat result",
      due: "Zakat due",
      summary: "2.5% of {net}, above the silver nisab",
      cash: "Cash and bank",
      gold: "Gold, 40 g at 22k",
      funds: "Long-term funds, 25% of {amount}",
      debts: "Debts due now",
      caption: "Example figures.",
    },
    featuresEyebrow: "The whole zakat year",
    featuresTitle: "More than a one-off sum",
    featuresLede:
      "Most calculators forget you the moment you close the tab. Mizan keeps the year: when your hawl began, what you hold, what you have given, and what is still due.",
    features: [
      {
        title: "Live nisab",
        body: "Today’s gold and silver prices in your currency, with both standards side by side. You choose which applies.",
      },
      {
        title: "Your hawl, on the Hijri calendar",
        body: "Count the lunar year from the day your wealth crossed nisab, on the tabular or Umm al-Qura calendar, with a reminder in your own calendar app.",
      },
      {
        title: "A ledger that knows zakat",
        body: "Cash, gold and silver by weight and karat, shares, crypto, business stock, money owed to you, and holdings in other currencies.",
      },
      {
        title: "Every gift in one place",
        body: "Zakat, sadaqah, Zakat al-Fitr, and purification, with the eight asnaf. See what is paid and what is still owed this cycle.",
      },
      {
        title: "Close the year with care",
        body: "Freeze the year’s figures, print a statement, start the next hawl, and leave a letter for next year’s self.",
      },
      {
        title: "On your phone",
        body: "Install it from the browser like an app. Light and dark, readable by everyone, and no app store needed.",
      },
    ],
    honestEyebrow: "Honest about differences",
    honestTitle: "Your school, your choices",
    honestBody:
      "Where scholars differ (the gold or silver nisab, jewellery you wear, long-term shares, pensions, debts), Mizan shows the difference and lets you choose, instead of deciding for you. It is an estimation aid, not a fatwa, and says so.",
    privateEyebrow: "Private by design",
    privateTitle: "Your wealth stays yours",
    privateItems: [
      "No advertising, no selling data, no bank logins.",
      "The calculator runs in your browser and saves nothing on a server.",
      "Passwords are hashed; one cookie keeps you signed in.",
      "Download everything, or delete your account, whenever you like.",
    ],
    privacyLink: "Privacy policy",
    questionsTitle: "Common questions",
    moreQuestions: "More questions",
    finalTitle: "Know what you owe before Ramadan ends.",
  },

  calculatorPage: {
    metaTitle: "Zakat calculator — free, private, no sign-up",
    metaDescription:
      "Work out your zakat in minutes with live gold and silver prices. Gold or silver nisab, jewellery by school, shares, crypto, and debts. Free, private, and nothing you type is stored on a server.",
    eyebrow: "Zakat calculator",
    title: "What do you owe this year?",
    lede: "Enter what you own and owe today. Mizan weighs it against nisab with live metal prices and gives you a figure in minutes. Free, no account, and nothing you type leaves your browser.",
    howTitle: "How the calculation works",
    how: [
      {
        title: "1. Add up",
        body: "Each holding is counted at today’s value. Long-term shares and pensions count only the share you set; worn jewellery follows the school you choose.",
      },
      {
        title: "2. Take off",
        body: "Debts due now are subtracted. What remains is your net zakatable wealth.",
      },
      {
        title: "3. Weigh",
        body: "If it meets nisab, zakat is 2.5% for a lunar year. Below nisab, nothing is due.",
      },
    ],
    faqTitle: "Questions people ask",
    faqFooter: "The arithmetic is open: {method} and {trust}. For your situation, ask a qualified person of knowledge.",
    appName: "Mizan zakat calculator",
  },

  calc: {
    step: "Step {n}",
    pricesTitle: "Today’s prices",
    pricesLede:
      "Nisab is set by the price of gold or silver. Filled in from a free public source when it answers; check it against your local market.",
    currency: "Currency",
    goldPerGram: "Gold, per gram",
    silverPerGram: "Silver, per gram",
    fetching: "Fetching today’s prices…",
    pricesUnavailable: "Live prices are unavailable. Enter today’s prices per gram.",
    livePricesFrom: "Live prices from {source}, {when}.",
    pricesFetched: "Prices fetched {when}.",
    refreshPrices: "Refresh prices",
    fetchPrices: "Fetch live prices",
    nisabStandard: "Nisab standard",
    silverTitle: "Silver · 595 g",
    silverDetailWithValue: "{amount} — the lower threshold, so more people give",
    silverDetail: "The lower threshold, so more people give",
    goldTitle: "Gold · 85 g",
    goldDetail: "The higher threshold",
    ownTitle: "What you own",
    ownLede:
      "Today’s value of what you have held for a lunar year. Leave blank what does not apply. Your home, car, and things you use are not counted.",
    oweTitle: "What you owe now",
    oweLede:
      "Bills, rent, credit cards, and loan instalments due now are taken off. A long mortgage is not deducted in full; scholars differ on the rest.",
    debtsDueNow: "Debts due now",
    yearBasis: "Year you count by",
    lunarTitle: "Lunar (Hijri) year · 2.5%",
    lunarDetail: "The year zakat is reckoned by.",
    solarTitle: "Solar year · 2.577%",
    solarDetail: "If you pay on a Gregorian date, adjusted for the longer year.",
    resultLabel: "Your zakat",
    needsSilverPrice: "Enter today’s silver price to compare against nisab.",
    needsGoldPrice: "Enter today’s gold price to compare against nisab.",
    enterHoldings: "Enter what you own to see what is due.",
    dueSummarySilver: "{rate} of {net}, which is at or above the silver nisab.",
    dueSummaryGold: "{rate} of {net}, which is at or above the gold nisab.",
    noneDue: "No zakat due",
    belowSummarySilver: "{net} is {gap} below the silver nisab of {nisab}.",
    belowSummaryGold: "{net} is {gap} below the gold nisab of {nisab}.",
    shareOf: "{share} of {amount}",
    netWealth: "Net zakatable wealth",
    nisabSilver: "Nisab (silver)",
    nisabGold: "Nisab (gold)",
    weightPriceMissing: "Something is entered by weight, but its price per gram is missing.",
    hawlNote:
      "Zakat is due on wealth that stayed at or above nisab for a full lunar year (the hawl). This is an estimate, not a ruling.",
    print: "Print or save PDF",
    clear: "Clear",
    clearConfirm: "Clear everything you entered?",
    keepTitle: "Keep this as a ledger",
    keepBody:
      "A free account counts your hawl on the Hijri calendar, tells you when zakat falls due, records what you give, and closes each year with a statement. These figures come with you.",
    keepNote: "",
    share: "Share the calculator",
    shareText: "A free, private zakat calculator with today’s gold and silver prices. No sign-up.",
    keepCta: "Create a free ledger",
    barDue: "Zakat due",
    barBelow: "Below nisab",
    byValue: "Enter a value instead",
    byWeight: "Enter by weight instead",
    jewelleryQuestion: "Count jewellery you wear?",
    jewelleryNo: "Not counted (Maliki, Shafi‘i, Hanbali)",
    jewelleryYes: "Counted (Hanafi)",
    grams: "{label}, grams",
    gramUnit: "g",
    purity: "{label}, purity",
    countedShare: "Counted share",
    karat: "{k}k ({fineness})",
    fineSilver: "Fine (999)",
    sterling: "Sterling (925)",
    fields: {
      cash: { label: "Cash in hand", hint: "Notes and coins at home or in your wallet." },
      bank: {
        label: "Bank balances",
        hint: "Current, savings and deposit accounts. Leave out interest earned: give it away separately.",
      },
      gold: {
        label: "Gold you keep as savings",
        hint: "Coins, bars, and gold bought as an investment.",
      },
      silver: {
        label: "Silver you keep as savings",
        hint: "Coins, bars, and silver bought as an investment.",
      },
      jewellery: {
        label: "Gold jewellery you wear",
        hint: "Counted or not according to the choice below.",
      },
      trading: {
        label: "Shares and funds you trade",
        hint: "Bought to sell on: counted at today’s market value.",
      },
      crypto: { label: "Cryptocurrency", hint: "At today’s market value." },
      longterm: {
        label: "Long-term shares and funds",
        hint: "Held for growth and dividends. Only part of the value is counted; set the share you follow.",
      },
      business: {
        label: "Business stock for sale",
        hint: "At what it would sell for today, not what it cost.",
      },
      receivables: {
        label: "Money owed to you",
        hint: "Loans you expect to be repaid. Leave out debts you doubt you will see.",
      },
      pension: {
        label: "Pension you can withdraw",
        hint: "Treatment differs widely. Set the share you follow, or leave it out if you cannot access it.",
      },
      other: {
        label: "Anything else zakatable",
        hint: "Rental income saved, a deposit you will get back, and the like.",
      },
    },
  },

  nisabPage: {
    indexMetaTitle: "Nisab today: gold and silver nisab in your currency",
    indexMetaDescription:
      "Today’s zakat nisab in sixty currencies, on the silver standard (595 g) and the gold standard (85 g), from live metal prices. Updated every hour.",
    indexTitle: "Nisab today",
    indexLede:
      "The least wealth on which zakat is due, at today’s gold and silver prices. Updated every hour.",
    currencyMetaTitle: "Nisab today in {currency} ({code})",
    currencyMetaDescription:
      "Today’s zakat nisab in {currency}: {silver} on the silver standard (595 g) and {gold} on the gold standard (85 g). Updated every hour.",
    currencyTitle: "Nisab today in {currency}",
    silverLabel: "Silver nisab · 595 g",
    goldLabel: "Gold nisab · 85 g",
    asOf: "Prices from {source}, {when}. Updated every hour; check them against your local market.",
    unavailable:
      "Live prices are unavailable right now. Try again shortly, or enter today’s prices in the calculator.",
    explainer:
      "If what you own, less debts due now, is at least the nisab you follow and you have held it for a lunar year, zakat of 2.5% is due on all of it. Many scholars recommend the silver standard because it is lower, so more people give.",
    cta: "Calculate your zakat in {code}",
    tableCurrency: "Currency",
    tableSilver: "Silver nisab",
    tableGold: "Gold nisab",
    allCurrencies: "Every currency",
    otherCurrencies: "Nisab in other currencies",
    share: "Share today’s nisab",
    shareText: "Nisab today in {currency}: {silver} on the silver standard, {gold} on the gold standard.",
  },

  faq: [
    {
      q: "What is nisab?",
      a: "Nisab is the least amount of wealth on which zakat is due. It is set by weight of precious metal: 85 grams of gold or 595 grams of silver. Its value in money moves with the metal price, so it is worked out on the day you reckon.",
    },
    {
      q: "Should I use the gold or the silver nisab?",
      a: "Both are prophetic standards, but today they are far apart in value. Many contemporary scholars and zakat bodies recommend the silver standard for cash and mixed wealth because it is lower, so more people give and more reaches those in need. Others use gold. Mizan shows both and lets you choose.",
    },
    {
      q: "What is the hawl?",
      a: "The hawl is one lunar (Hijri) year, about 354 days. Zakat is due on wealth that has stayed at or above nisab for a full hawl. Many people pick a fixed day, such as a date in Ramadan, and reckon everything they hold on that day each year.",
    },
    {
      q: "What do I pay zakat on?",
      a: "Cash, bank balances, gold and silver, shares and funds, cryptocurrency, business stock for sale, and money owed to you that you expect back. Your home, car, clothes, furniture, and other things for personal use are not counted.",
    },
    {
      q: "Is jewellery zakatable?",
      a: "Schools differ. The Hanafi school counts gold and silver jewellery, including pieces worn. The Maliki, Shafi‘i, and Hanbali schools generally exempt jewellery kept for personal adornment. Jewellery held as an investment is counted by all.",
    },
    {
      q: "How are shares and pensions treated?",
      a: "Shares bought to sell on are counted at full market value. For long-term holdings, a common modern method counts only the company’s zakatable assets per share, often estimated at around a quarter of the share price. Pensions depend on whether you can access the money; ask someone you trust.",
    },
    {
      q: "Can I deduct my debts?",
      a: "Debts due now, such as bills, credit card balances, and loan instalments that have fallen due, are commonly deducted. For long-term debts like a mortgage, many contemporary scholars deduct only what is due in the coming year, not the whole balance.",
    },
    {
      q: "Why is the rate 2.577% on a solar year?",
      a: "Zakat is 2.5% for each lunar year. A solar year is about eleven days longer, so if you reckon on a Gregorian date the rate is scaled by 365.25 / 354.367, about 2.577%, to stay fair over time.",
    },
    {
      q: "Is what I type saved or sent anywhere?",
      a: "The calculator runs in your browser. Your figures stay in this browser’s storage so a refresh does not lose them, and you can clear them at any time. The only thing sent to Mizan is your currency code, to look up today’s metal prices.",
    },
  ],
};

/** Every string a translation must provide, with the same structure. */
type Shape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Shape<U>[]
    : { [K in keyof T]: Shape<T[K]> };

export type Messages = Shape<typeof en>;

export default en satisfies Messages;
