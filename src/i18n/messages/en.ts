// The English text of the public pages, and the shape every translation
// must match (see ./index.ts). Placeholders like {amount} are filled with
// `fmt` from ../config.

const en = {
  common: {
    nav: {
      start: "Start here",
      calculator: "Calculator",
      nisab: "Nisab today",
      method: "Method",
      signIn: "Sign in",
      openLedger: "Open a ledger",
      yourLedger: "Your ledger",
    },
    footer: {
      ramadan: "Ramadan giving",
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
    shareAnswer: "Share this answer",
    /** The header's language menu. */
    language: "Language",
    /** Offered, in this language, to visitors whose browser prefers it. */
    readHere: "Read this page in English",
    notNow: "Not now",
    /** Read the text aloud with the device's own voice. */
    listen: "Listen",
    stopListening: "Stop",
    largerText: "Larger text",
    /** The menu at the top of every page, by what people want to do. */
    menu: {
      open: "Menu",
      close: "Close the menu",
      work: "Work out my zakat",
      give: "Give it",
      learn: "Learn",
      tools: "More tools",
    },
    /** For someone coming back to something they started. */
    resume: { title: "Pick up where you left off", continue: "Continue" },
  },

  landing: {
    metaTitle: "Mizan: free zakat calculator and ledger",
    metaDescription:
      "A free, private zakat calculator and ledger. Weigh your wealth against nisab, track the hawl on the Hijri calendar, record zakat and sadaqah, and close each year with a clear statement.",
    eyebrow: "الميزان · the balance",
    newHere: "New to zakat? Start here",
    newHereHint: "Plain words and three quick questions. No sign-up.",
    chooseTitle: "What would you like to do?",
    choose: {
      start: "Find out if I have to pay",
      guide: "Work out my zakat, step by step",
      counts: "Check what counts",
      who: "Check who can receive it",
      fitr: "Zakat al-Fitr for my family",
      nisab: "See today’s nisab",
      missed: "Catch up on years I missed",
      ask: "Ask a question",
    },
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
    yourCurrency: "Your currency",
    currencyHint: "The money you count in. Amounts and today’s prices follow it.",
    pricesLine: "Gold {gold} a gram · Silver {silver} a gram",
    /** For currencies where people weigh gold in tola (11.66 g). */
    tolaLine: "Gold {gold} a tola · Silver {silver} a tola",
    usingOwnPrices: "Using the prices you entered.",
    enterOwnPrices: "Enter prices yourself",
    moreKinds: "More kinds of wealth",
    moreKindsHint: "Shares, crypto, business stock, money owed to you, pensions, and more.",
    optionsTitle: "How zakat is counted",
    optionsHint:
      "Already set to the most common choices. Change them only if you follow a different view.",
    nextTitle: "What to do now",
    nextSteps: [
      "Give it to people in need, yourself or through a mosque or charity you trust.",
      "Pay it soon. Once zakat is due, it should not be delayed.",
      "Note today’s date. In one Islamic year, on the same date, work it out again.",
    ],
    belowNext:
      "You can still give sadaqah, charity by choice, at any time. Check again if your savings grow.",
    guideLink: "Prefer one question at a time? Go step by step",
    givenTitle: "Given so far",
    givenHint: "If you give your zakat in parts, note what you have given. It stays on this device.",
    stillToGive: "Still to give: {amount}",
    allGiven: "All given. May Allah accept it from you.",
    /** Under the prayer for acceptance (2:127), shown in Arabic once all is given. */
    acceptDua: "“Our Lord, accept this from us. You are the All-Hearing, the All-Knowing.” (Quran 2:127)",
    difference: "What’s the difference?",
    basisDifference:
      "Zakat is counted by the Islamic (lunar) year, about 354 days. If you pay on the same Gregorian date each year instead, your year is about 11 days longer, so the rate goes up slightly, to 2.577%, to make up for it.",
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
    tolaUnit: "tola",
    tolaLabel: "{label}, tola",
    weighIn: "Weigh in",
    unitGrams: "Grams",
    unitTola: "Tola",
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

  start: {
    metaTitle: "Zakat for beginners: do I have to pay, and how much?",
    metaDescription:
      "Zakat explained in plain words. Answer three simple questions to see if you have to pay, with today’s nisab in your own currency. Free, private, no sign-up.",
    eyebrow: "New to zakat? Start here",
    title: "Zakat, in plain words",
    lede: "You do not need to know anything to begin. This page explains zakat simply, and three quick questions tell you whether you have to pay.",
    whatTitle: "What is zakat?",
    whatBody:
      "Zakat is a yearly gift from your savings to people in need. It is one of the five pillars of Islam. If your savings stay above a set amount for a whole year, you give a small part of them: 2.5%. It purifies your wealth and helps the poor.",
    checkTitle: "Do I have to pay zakat?",
    checkLede: "Answer three questions. Nothing you choose here is saved or sent anywhere.",
    showIn: "Amounts shown in",
    q1: "Do you have any savings?",
    q1Hint: "Count cash at home, money in the bank, and gold or silver you keep.",
    q2: "Are your savings worth more than {amount}?",
    q2NoPrice: "Are your savings worth more than the price of 595 grams of silver?",
    q2Hint:
      "This amount is called nisab: the price of 595 grams of silver today. Some scholars use gold instead, which is {gold}.",
    q3: "Have you had at least this much for about a year?",
    q3Hint:
      "Zakat is due once your savings have stayed above nisab for one Islamic (lunar) year, about 354 days.",
    yes: "Yes",
    no: "No",
    notSure: "I’m not sure",
    noTitle: "You do not have to pay zakat now",
    noBody:
      "Zakat is only due on savings above nisab. You can still give charity (sadaqah) whenever you like, and it is rewarded. Check again if your savings grow.",
    notYetTitle: "Not yet",
    notYetBody:
      "Zakat becomes due when your savings have stayed above nisab for one Islamic year. Note today’s date and check again in a year. A free ledger can count the year for you and remind you.",
    yesTitle: "You probably have to pay zakat",
    yesBody:
      "Zakat is 2.5% of your savings: for every 1,000 you have, you give 25. The calculator adds everything up for you in a few minutes.",
    unsureTitle: "Let’s add it up together",
    unsureBody:
      "That is fine. The calculator asks about each kind of saving, one at a time, and tells you whether zakat is due and how much.",
    ctaCalculate: "Work out my zakat",
    ctaGuide: "Work it out with me, step by step",
    ctaYear: "Count the year for me",
    startAgain: "Start again",
    howMuchTitle: "How much do I give?",
    howMuchBody:
      "Zakat is 2.5% of your savings, which is one fortieth. To work it out, divide your savings by 40.",
    howMuchExample: "Example: savings of 200,000 ÷ 40 = 5,000 zakat.",
    countsTitle: "What counts",
    counts: [
      "Cash at home or in your wallet",
      "Money in bank accounts",
      "Gold and silver, including coins and bars",
      "Shares, funds, and crypto",
      "Goods your business holds to sell",
      "Money others owe you that you expect back",
    ],
    notCountsTitle: "What does not count",
    notCounts: [
      "The home you live in",
      "Your car, clothes, and furniture",
      "Things you use every day, like your phone",
      "Money you need for debts that are due now",
    ],
    jewelleryNote: "Jewellery you wear: scholars differ. The calculator lets you choose.",
    whenTitle: "When do I pay?",
    whenBody:
      "Once a year. Many people pick a day, often in Ramadan, and add up their savings on that day every year. Once zakat is due, pay it without delay.",
    missedTitle: "Missed past years?",
    missedBody:
      "If you have never paid, or missed some years, you can still put it right. Past zakat is owed like a debt: add it up and pay it as you are able.",
    missedLink: "Add up what you missed",
    whoTitle: "Who do I give it to?",
    whoBody:
      "To people in need: the poor, people who cannot meet their needs, people crushed by debt, travellers in difficulty, and the other groups named in the Quran (9:60). Many mosques and trusted charities collect it and pass it on. Zakat is not given to your parents or children, or by a husband to his wife: providing for them is already your duty. Other relatives in need can receive it.",
    wordsTitle: "Words you will see",
    words: [
      {
        term: "Nisab",
        meaning:
          "The least savings on which zakat is due: the price of 595 g of silver or 85 g of gold.",
      },
      {
        term: "Hawl",
        meaning: "One Islamic (lunar) year, about 354 days. Savings must stay above nisab this long.",
      },
      {
        term: "Sadaqah",
        meaning: "Any charity you give by choice, at any time, of any amount.",
      },
      {
        term: "Zakat al-Fitr",
        meaning:
          "A small payment for each person in the family, given before the Eid prayer at the end of Ramadan. It is separate from zakat on savings.",
      },
      {
        term: "Madhhab",
        meaning:
          "A school of Islamic law, such as Hanafi or Shafi‘i. Where they differ, Mizan lets you choose.",
      },
    ],
    askTitle: "Still not sure?",
    askBody:
      "That is normal. Ask the imam at your local mosque, or someone of knowledge you trust. Mizan helps you add things up; it does not give rulings.",
    guidesLink: "Read the zakat guides",
  },

  guide: {
    metaTitle: "Work out your zakat step by step",
    metaDescription:
      "A guided zakat calculator for beginners: one simple question at a time, each step explained in plain words, with today’s gold and silver prices. Free, private, no sign-up.",
    eyebrow: "Step by step",
    title: "Let’s work out your zakat together",
    lede: "One question at a time. Each step says what to count and why. If you don’t have something, skip it.",
    stepOf: "Step {n} of {total}",
    next: "Next",
    back: "Back",
    skip: "I don’t have this",
    seeResult: "Show my zakat",
    difference: "What’s the difference?",
    byWeight: "I know the weight",
    byValue: "I know what it’s worth",
    grams: "Weight in grams",
    tolaWeight: "Weight in tola",
    tolaHint: "1 tola is about 11.66 grams.",
    karat: "Purity (karat)",
    value: "What it’s worth today",
    amount: "Amount",
    worth: "Worth about {amount} at today’s price.",
    picker: {
      dontKnow: "I don’t know the weight",
      title: "Tap each piece you have",
      estimate: "About {weight}: a rough guess from typical weights.",
      hint: "Pieces vary a lot. A jeweller can weigh them for an exact figure.",
      use: "Use this weight",
      add: "Add one: {item}",
      remove: "Take one away: {item}",
      items: {
        ring: "Ring",
        earrings: "Earrings (pair)",
        nosePin: "Nose pin",
        chain: "Chain",
        bracelet: "Bracelet",
        bangle: "Bangle",
        necklace: "Necklace",
        coin: "Gold coin",
      },
    },
    steps: {
      currency: {
        title: "Which money do you use?",
        body: "Choose your currency. We show amounts in it, and today’s nisab: the least savings on which zakat is due.",
        nisab: "Nisab today: {silver} on silver, or {gold} on gold.",
        loading: "Getting today’s gold and silver prices…",
        unavailable:
          "Live prices are unavailable right now. You can carry on; we will ask for today’s prices before the end.",
        yours:
          "Count only what is yours. In a family, each person gives zakat on their own wealth: a wife on her own jewellery and savings, for example.",
      },
      cash: {
        title: "How much cash do you have?",
        body: "Count the notes and coins at home and in your wallet, as they are today. Zakat looks at what you have on the day you count.",
      },
      bank: {
        title: "How much is in your bank accounts?",
        body: "Add up current and savings accounts, and money in mobile wallets or payment apps.",
        difference:
          "Interest is different. If your bank paid you interest, leave it out here and give it away to charity separately. It is not yours to keep, and giving it away does not count as zakat.",
      },
      gold: {
        title: "Do you keep any gold?",
        body: "Count coins, bars, and gold you keep as savings rather than wear. If you know the weight, we work out its value from today’s price.",
        difference:
          "Karat says how pure the gold is. 24 karat is pure gold; 22 karat is 91.6% gold, 21 karat is 87.5%, and 18 karat is 75%. Only the gold in it is counted.",
      },
      jewellery: {
        title: "Do you wear gold jewellery?",
        body: "Rings, bangles, necklaces, and other gold jewellery you wear.",
        question: "Is it counted for you?",
        difference:
          "Scholars differ here. The Hanafi school counts jewellery you wear. The Maliki, Shafi‘i, and Hanbali schools do not count jewellery worn in the normal way. If you are not sure which you follow, counting it is the cautious choice, and you can ask your imam.",
      },
      silver: {
        title: "Do you keep any silver?",
        body: "Coins, bars, and silver you keep as savings.",
      },
      more: {
        title: "Do you have any of these?",
        body: "Tick what you have and enter what it is worth today. Most people can skip this step.",
        difference:
          "Shares you bought to sell soon count in full. Shares you keep for the long term count only in part, because much of a company’s value is buildings and machines, which are not zakatable; a quarter is a common estimate.",
      },
      debts: {
        title: "Do you owe money that is due now?",
        body: "Bills, rent, and loan payments you must make now are taken off before zakat is worked out.",
        difference:
          "Only what is due now is taken off. For a long loan like a mortgage, take off the payments due soon (many scholars say up to a year), not the whole amount still owed.",
      },
      nisab: {
        title: "Which nisab do you follow?",
        body: "Nisab is the line. If your savings are below it, no zakat is due.",
        difference:
          "Nisab was set as 595 grams of silver or 85 grams of gold. Today silver is far cheaper, so the silver line is lower and more people pay zakat, which helps more people in need. Many scholars recommend silver for savings in money; some use gold. If you are not sure, choose silver.",
        prices: "Enter today’s price of one gram of gold and of silver where you live.",
      },
    },
    result: {
      due: "Your zakat is {amount}",
      none: "No zakat is due",
      total: "Everything you counted comes to {total}.",
      debts: "Taking off debts due now ({debts}) leaves {net}.",
      above: "That is above nisab ({nisab}), so zakat is due: {rate} of {net} is {zakat}.",
      below: "That is below nisab ({nisab}), so no zakat is due now.",
      hawl: "This assumes you have had at least nisab for a whole Islamic year. If not, zakat is not due yet.",
      doTitle: "What you can do now",
      reminder: "Remind me next year",
      reminderHint: "Adds {date} to your calendar: one Islamic year from today.",
      reminderSummary: "Zakat: time to work it out again",
      reminderBody:
        "One Islamic year has passed since you last worked out your zakat. Check the date with your local moon-sighting.",
      print: "Print or save",
      ledger: "Keep this in a free ledger",
      ledgerHint: "It counts your year, records what you give, and reminds you when zakat is due.",
      calculator: "Check it in the full calculator",
      change: "Change my answers",
      who: "Who can receive zakat?",
      share: "Share this with family and friends",
      shareText: "Work out your zakat step by step, in plain words. Free and private:",
    },
  },

  ramadan: {
    plan: "Plan your Ramadan giving",
    /** {when} is "in 120 days", "tomorrow", … in the page's language. */
    before: "Ramadan {year} begins around {date}, {when}.",
    during: "It is Ramadan, day {day}. Eid al-Fitr is around {date}.",
    hint: "Many people work out and give their zakat in Ramadan. The exact day depends on the moon sighting where you live.",
    duringHint: "Give Zakat al-Fitr before the Eid prayer.",
    today: "Today is {date}.",
    remind: "Remind me a week before Ramadan",
    reminderSummary: "Ramadan is coming: time to work out your zakat",
    reminderBody: "Ramadan begins in about a week. Work out your zakat and plan your giving.",
    fitrLink: "Work out Zakat al-Fitr",
  },

  poster: {
    metaTitle: "A free zakat poster for your mosque",
    metaDescription:
      "Print a one-page poster that helps people in your mosque or community work out their zakat, with a code to scan. In eight languages.",
    nav: "Poster for your mosque",
    eyebrow: "For mosques and community centres",
    title: "A poster for your mosque",
    lede: "Print it on A4 and put it on the noticeboard. People scan the code with their phone and are taken to plain-words help in this language.",
    print: "Print the poster",
    headline: "Do you have to pay zakat?",
    points: [
      "Zakat is 2.5% of savings you have had for a year.",
      "It is due if your savings are worth more than nisab: the price of 595 grams of silver.",
      "Find out in three questions, free and private, in your own language.",
    ],
    scan: "Scan with your phone",
    orVisit: "or visit",
  },

  worksheet: {
    nav: "Paper worksheet",
    metaTitle: "A printable zakat worksheet to fill in by hand",
    metaDescription: "One page to print and fill in with a pen: what you have, what you owe, the nisab, and your zakat, step by step. For anyone who prefers paper, or a mosque helping its elders. Free, in eight languages.",
    eyebrow: "Work it out on paper",
    title: "Zakat on one sheet of paper",
    lede: "Print this page and fill it in with a pen, alone or with someone helping you. Write every amount in your own money.",
    print: "Print the worksheet",
    heading: "My zakat worksheet",
    day: "Date",
    currency: "My money (currency)",
    haveTitle: "1. What I have today",
    have: [
      "Cash at home and in my wallet",
      "Money in bank accounts",
      "Gold I keep as savings: grams × price per gram",
      "Silver: grams × price per gram",
      "Shares, funds, and savings schemes",
      "Goods for sale in my business",
      "Money people owe me that I expect back",
    ],
    haveTotal: "A. All of this added up",
    oweTitle: "2. What I must pay now",
    owe: [
      "Bills and rent due now",
      "Loan instalments and card balances due now",
    ],
    oweTotal: "B. All of this added up",
    netTitle: "3. What counts",
    net: "C. A minus B",
    nisabTitle: "4. The nisab",
    nisab: "D. Nisab today",
    nisabHint: "Many use 595 grams of silver × the price per gram; others use 85 grams of gold. Your mosque, or the code below, can tell you today’s amount.",
    nisabRule: "If C is less than D, there is no zakat to pay this year.",
    zakatTitle: "5. My zakat",
    zakat: "C ÷ 40 (the same as 2.5%)",
    notCounted: "Not counted: the home you live in, your car, furniture, clothes, and things you use.",
    tola: "1 tola = 11.66 grams.",
    jewellery: "Jewellery you wear: scholars differ. Ask your imam whether to count it.",
    help: "Need help or today’s prices? Scan the code, or ask at your mosque.",
  },

  applies: {
    metaTitle: "Do I pay zakat on my house, car, salary, or savings?",
    metaDescription:
      "Tap a thing to see whether zakat is due on it: the home you live in, your car, your salary, savings for Hajj or a wedding, land, rented property, gold, gems, loans, shares, and pensions. Plain words, and where scholars differ.",
    nav: "Do I pay zakat on…?",
    eyebrow: "What counts",
    title: "Do I pay zakat on…?",
    lede: "Tap what you are wondering about. You will see the short answer and why, in plain words.",
    verdicts: {
      yes: "Yes",
      no: "No",
      mostNo: "Most scholars say no",
      partly: "Only part of it",
      ifSaved: "Only what you still have",
      differ: "Scholars differ",
    },
    cases: {
      home: {
        label: "The home you live in",
        answer: "No. A home for your own use is not counted, however much it is worth.",
      },
      car: {
        label: "Your car, furniture, and things you use",
        answer: "No. Things you keep for your own use are not counted.",
      },
      salary: {
        label: "Your salary",
        answer:
          "Zakat is not paid on each salary. On your zakat day, whatever you still have saved from it is counted with your other savings.",
      },
      goals: {
        label: "Money saved for Hajj, a wedding, or a house",
        answer: "Yes, if it is still with you on your zakat day. Savings count whatever you plan to spend them on.",
      },
      bullion: {
        label: "Gold or silver coins and bars",
        answer: "Yes, at today’s value, by weight and purity.",
      },
      jewellery: {
        label: "Gold jewellery you wear",
        answer:
          "Scholars differ. The Hanafi school counts it. The Maliki, Shafi‘i, and Hanbali schools do not count jewellery worn in the normal way.",
      },
      gems: {
        label: "Diamonds, pearls, and other gems",
        answer: "No, unless you keep them to sell. Gems are not counted the way gold and silver are.",
      },
      landToSell: {
        label: "Land or property you bought to sell",
        answer: "Yes, at what it would sell for today, each year you hold it.",
      },
      landToLive: {
        label: "Land you bought to build your own home",
        answer: "Most scholars say no, because it is not for sale. If you decide to sell it, it counts from then.",
      },
      rental: {
        label: "Property you rent out",
        answer: "The building is not counted. The rent you have saved by your zakat day is counted with your savings.",
      },
      business: {
        label: "Goods in your shop or business",
        answer:
          "Yes, at what they would sell for today. The shop itself, its shelves, and its equipment are not counted.",
      },
      lent: {
        label: "Money you lent to someone",
        answer:
          "Yes, if you expect to get it back. If you doubt you will, many scholars say you pay on it when it is returned.",
      },
      shares: {
        label: "Shares and funds",
        answer:
          "Yes. Shares you trade count in full. For shares you keep for the long term, only part of the value is counted; a quarter is a common estimate.",
      },
      crypto: {
        label: "Cryptocurrency",
        answer: "Scholars who allow holding it count it like money, at today’s value.",
      },
      pension: {
        label: "A pension you cannot draw yet",
        answer:
          "Scholars differ. Many say pay on it once you can draw it; others count the part you could take out today.",
      },
      bonds: {
        label: "Savings certificates and bonds",
        answer:
          "The amount you put in counts. Interest is not yours to keep: give it away separately, and it does not count as zakat.",
      },
    },
  },

  sources: {
    metaTitle: "Where Mizan’s zakat rules come from: Quran and hadith",
    metaDescription:
      "The Quran verses and hadith behind zakat: the 2.5% rate, nisab in silver and gold, the year, the eight groups who receive it, and Zakat al-Fitr, in plain words.",
    nav: "Where this comes from",
    eyebrow: "Sources",
    title: "Where this comes from",
    lede: "Each rule Mizan uses, and the verse of the Quran or the hadith it rests on, in plain words.",
    note: "Hadith are named by their collection rather than a number, because numbering differs between editions. Gram weights are the common modern conversions of the old measures. For your own situation, ask a scholar.",
    items: [
      {
        rule: "Zakat is a duty and one of the five pillars of Islam.",
        source:
          "The Quran pairs prayer and zakat many times, as in 2:43 and 2:110. The Prophet ﷺ said Islam is built on five, zakat among them (Sahih al-Bukhari, Sahih Muslim).",
      },
      {
        rule: "It purifies your wealth.",
        source: "“Take from their wealth a charity to purify them and cause them to grow” (Quran 9:103).",
      },
      {
        rule: "Nothing is due below nisab: 595 grams of silver, or 85 grams of gold.",
        source:
          "No zakat is due on less than five awqiyah of silver (Sahih al-Bukhari, Sahih Muslim). Nothing is due on gold until it reaches twenty dinars (Sunan Abi Dawud).",
      },
      {
        rule: "The rate is 2.5%, one fortieth.",
        source: "On two hundred dirhams held for a year, five dirhams are due (the hadith of ‘Ali, Sunan Abi Dawud).",
      },
      {
        rule: "Zakat is due once a year has passed over the wealth.",
        source: "No zakat is due on wealth until a year has passed over it (Sunan Abi Dawud, Sunan Ibn Majah).",
      },
      {
        rule: "Eight groups receive zakat.",
        source:
          "The poor, the needy, those who collect it, those whose hearts are being won over, freeing captives, people in debt, in the way of God, and the stranded traveller (Quran 9:60).",
      },
      {
        rule: "Zakat is not for the family of the Prophet ﷺ.",
        source: "Charity is not lawful for Muhammad or the family of Muhammad (Sahih Muslim).",
      },
      {
        rule: "Giving to a relative in need is rewarded twice.",
        source: "Charity to the poor is charity; to a relative it is two: charity and keeping family ties (Sunan al-Tirmidhi).",
      },
      {
        rule: "Many scholars let a wife give her zakat to a husband in need.",
        source: "The hadith of Zaynab, the wife of Ibn Mas‘ud (Sahih al-Bukhari, Sahih Muslim). Scholars differ on whether it was about zakat or voluntary charity.",
      },
      {
        rule: "Zakat al-Fitr: one sa‘ for each person, before the Eid prayer.",
        source:
          "The Prophet ﷺ made Zakat al-Fitr a duty, a sa‘ of dates or of barley, on every Muslim, young and old, to be given before people go out to the prayer (Ibn ‘Umar, Sahih al-Bukhari, Sahih Muslim).",
      },
      {
        rule: "Given after the Eid prayer, it counts as ordinary charity.",
        source: "Whoever gives it before the prayer, it is accepted zakat; whoever gives it after the prayer, it is one of the charities (Ibn ‘Abbas, Sunan Abi Dawud).",
      },
      {
        rule: "Giving does not make you poorer.",
        source: "Charity does not decrease wealth (Sahih Muslim).",
      },
    ],
  },

  who: {
    metaTitle: "Who can receive zakat? Can I give zakat to my family?",
    metaDescription:
      "Tap a person to see whether your zakat can go to them: parents, brothers and sisters, a husband or wife, people in debt, charities, mosques, and more. Plain words, and where scholars differ.",
    nav: "Can I give zakat to…?",
    eyebrow: "Giving your zakat",
    title: "Can I give zakat to…?",
    lede: "Tap who you are thinking of. You will see the answer in plain words, and where scholars differ.",
    pick: "Who are you thinking of?",
    verdicts: {
      yes: "Yes",
      ifNeed: "Yes, if they are in need",
      no: "No",
      mostNo: "Most scholars say no",
      differ: "Scholars differ",
    },
    cases: {
      parents: {
        label: "My mother or father",
        answer:
          "No. Looking after your parents and grandparents is already your duty, so zakat given to them does not count. Help them from your other money.",
      },
      children: {
        label: "My son or daughter",
        answer:
          "No. The same goes for grandchildren: providing for them is already your duty.",
      },
      wife: {
        label: "My wife",
        answer: "No. A husband must already provide for his wife, so his zakat cannot go to her.",
      },
      husband: {
        label: "My husband",
        answer:
          "Scholars differ. Many allow a wife to give her zakat to her husband if he is in need, following the hadith of Zaynab, the wife of Ibn Mas‘ud. Others, including the Hanafi school, do not. Ask your imam.",
      },
      siblings: {
        label: "My brother or sister",
        answer:
          "Yes, if they are in need. Many scholars say it is even better: it is charity and it keeps family ties. If they live with you and you already support them, ask your imam.",
      },
      relatives: {
        label: "An uncle, aunt, cousin, or in-law",
        answer: "Yes, if they are in need. Giving to family in need is rewarded twice: as charity and as keeping family ties.",
      },
      poor: {
        label: "A poor neighbour, friend, or stranger",
        answer:
          "Yes, if they cannot meet their basic needs. You do not have to tell them it is zakat; give in a way that keeps their dignity.",
      },
      debt: {
        label: "Someone who cannot pay their debts",
        answer: "Yes. People weighed down by debts they cannot pay are named in the Quran (9:60) among those who receive zakat.",
      },
      student: {
        label: "A student in need",
        answer: "Yes, if they are poor and cannot cover their living costs while they study.",
      },
      charity: {
        label: "A charity or zakat collector",
        answer:
          "Yes, if they keep zakat apart and pass it only to people who can receive it. Ask them how they use zakat before you give.",
      },
      mosque: {
        label: "Building or running a mosque",
        answer:
          "Most scholars say no: zakat goes to people in need, not to buildings. Support the mosque from your sadaqah instead.",
      },
      sayyid: {
        label: "A Sayyid (descendant of the Prophet ﷺ)",
        answer:
          "Most scholars say no: the Prophet ﷺ said zakat is not for his family. Help them with gifts or sadaqah instead.",
      },
      nonMuslim: {
        label: "Someone who is not Muslim",
        answer: "Most scholars say zakat is for Muslims in need. You can help anyone with sadaqah.",
      },
      wealthy: {
        label: "Someone who is not in need",
        answer: "No. Zakat is for people in need and the other groups named in the Quran, not for people who already have enough.",
      },
      employee: {
        label: "My worker, as part of their pay",
        answer:
          "No. Zakat cannot pay what you owe someone for their work. You can give zakat to a worker in need on top of their pay.",
      },
    },
    groups: [
      "The poor",
      "People in need",
      "Those who collect it",
      "Winning hearts",
      "Freeing captives",
      "People in debt",
      "In the way of Allah",
      "Stranded travellers",
    ],
    eight:
      "The Quran (9:60) names eight groups who receive zakat: the poor, the needy, those who collect it, those whose hearts are being won over, freeing captives, people in debt, in the way of God, and stranded travellers.",
    ask: "Not sure about your case? Ask the imam at your mosque.",
  },

  fitr: {
    metaTitle: "Zakat al-Fitr (fitrana) calculator for your household",
    metaDescription:
      "Work out Zakat al-Fitr (fitrana, zakat fitrah) for everyone you provide for: who gives it, how much, and when it is due before the Eid prayer. Free, no account.",
    appName: "Mizan Zakat al-Fitr calculator",
    eyebrow: "End of Ramadan",
    title: "Zakat al-Fitr calculator",
    lede: "One set amount for yourself and each person you provide for, children included, given before the Eid prayer. Enter the amount your mosque or council announced this year.",
    people: "People you provide for",
    peopleHint: "Including yourself.",
    perPerson: "Amount per person ({currency})",
    perPersonHint: "The amount your mosque or council announces this year: the price of one sa‘ of staple food where you live.",
    needPeople: "Count everyone you provide for: a whole number from 1 to {max}.",
    needAmount: "Enter the per-person amount your mosque or council announced.",
    line: "{people} × {amount}",
    total: "Zakat al-Fitr to give",
    schools:
      "Schools differ on giving food or its value in money, and on the size of the measure. Follow the guidance of those you trust; this only does the multiplication.",
    ledgerLink: "Open a free ledger",
    ledgerRest: "to keep it on record beside your zakat, with a statement at the end of the year.",
    sections: [
      {
        heading: "Who gives it",
        body: "Every Muslim who has more than they need for the day and night of Eid gives it for themselves and for those they are responsible for: a spouse, young children, and other dependants. Most schools include a child born before sunset on the last day of Ramadan. The Hanafi school ties the duty to owning wealth at the nisab beyond one’s needs.",
      },
      {
        heading: "How much",
        body: "One sa‘ of the local staple food per person: roughly 2.5 to 3 kg of dates, barley, raisins, wheat, or rice. The Hanafi school accepts half a sa‘ of wheat and allows its value in money; most other scholars prefer the food itself. Councils and mosques announce a money amount each Ramadan from local prices, so Mizan does not guess it.",
      },
      {
        heading: "When it is due",
        body: "Before the Eid al-Fitr prayer. Many give it a day or two earlier so it reaches the poor in time; the Shafi‘i school allows it from the start of Ramadan, and the Hanafi school earlier still. Given after the prayer, it counts as ordinary charity and the duty remains owed. It goes to the poor and needy, so they too can celebrate.",
      },
      {
        heading: "It is not zakat on savings",
        body: "Zakat al-Fitr is due per person, whatever you own above the day’s needs. Zakat on savings is 2.5% of what you hold above nisab for a lunar year.",
      },
    ],
    calculatorLink: "Work out zakat on your savings",
    faqTitle: "Questions",
    faq: [
      {
        q: "Do I pay Zakat al-Fitr for my children?",
        a: "Yes. The head of the household gives it for every dependant, including children who rely on them. Most scholars also include a child born before the end of Ramadan.",
      },
      {
        q: "Can I give money instead of food?",
        a: "The Hanafi school permits giving the value in money, and many councils announce a money amount for that reason. The Maliki, Shafi‘i, and Hanbali schools prefer the staple food itself. Follow the scholars you trust.",
      },
      {
        q: "Is Zakat al-Fitr the same as fitrana or zakat fitrah?",
        a: "Yes. Fitrana (South Asia), zakat fitrah (Southeast Asia), and sadaqat al-fitr all name the same duty at the end of Ramadan.",
      },
      {
        q: "What if I missed the deadline?",
        a: "Give it as soon as you can. Given after the Eid prayer, it counts as charity rather than Zakat al-Fitr, but the duty is not cancelled by being late.",
      },
    ],
  },

  ask: {
    nav: "Ask a question",
    metaTitle: "Zakat questions and answers: search in plain words",
    metaDescription: "Type a word, like gold, salary, or mother, and see every answer about it: what counts, who can receive zakat, Zakat al-Fitr, missed years, and the words you will hear. Free.",
    eyebrow: "Questions and answers",
    title: "Ask a question about zakat",
    lede: "Type a word or two, like gold, salary, or mother. You will see every answer that mentions it.",
    searchLabel: "What do you want to know?",
    placeholder: "For example: gold",
    allTitle: "All questions",
    resultsTitle: "Answers",
    none: "No answer mentions that yet. Try another word, or ask a scholar you trust.",
    more: "More on this page:",
  },

  missed: {
    nav: "Missed past years? How to catch up",
    metaTitle: "Missed zakat for past years? How to catch up, step by step",
    metaDescription:
      "Never paid zakat, or missed some years? What to do, in plain words, with a simple tally of what you owe and a plan to pay it a little each month. Free, no sign-up.",
    eyebrow: "Catching up",
    title: "Missed some years? You can still put it right",
    lede: "Many people only learn about zakat later in life. Zakat from past years is still owed, like a debt, and paying it now is what matters. There is no extra penalty, and it is never too late to start.",
    tallyTitle: "Add up what you owe",
    yearsLabel: "How many years did you miss?",
    yearsHint: "Count from the first year your savings reached the nisab. A guess is fine.",
    sameLabel: "Roughly how much did you have each year? ({currency})",
    sameHint: "What you had saved on your zakat day, in the money of that time. If you are not sure, guess a little high, so you know it is covered.",
    differentButton: "It was different each year",
    sameButton: "It was about the same each year",
    eachHint: "Leave a year empty if you had less than the nisab then, or nothing saved.",
    planLabel: "Pay it",
    planNow: "All at once",
    planOver: "Over {months}",
    total: "Owed for past years",
    line: "2.5% of what you had, for each year you counted",
    perMonth: "{amount} a month for {months}",
    needYears: "Enter how many years, from 1 to {max}.",
    needAmount: "Enter roughly what you had.",
    stepsTitle: "What to do, step by step",
    steps: [
      "Don’t panic and don’t feel ashamed. Allah is Most Forgiving, and wanting to put this right is itself a good deed.",
      "Work out roughly how many years you missed, starting from the first year your savings reached the nisab.",
      "For each year, guess what you had on your zakat day. A rough number is enough; write it down.",
      "Take 2.5% of each year and add them up. The tally above does this for you.",
      "Pay as soon as you can. If you can’t pay it all at once, give what you can now and set aside a fixed amount each month until it is done.",
      "From now on, keep one day each year as your zakat day, so it doesn’t build up again.",
    ],
    guideLink: "Work out this year’s zakat",
    whoLink: "Who can receive zakat",
    faqTitle: "Questions people ask",
    faq: [
      {
        q: "Do I owe it for years when I didn’t know about zakat?",
        a: "Most scholars say yes: zakat is due on the wealth whether or not you knew, so past years are still owed. A few say someone who truly didn’t know isn’t held to it. Paying is the safer choice; if it worries you, ask a scholar you trust.",
      },
      {
        q: "I can’t remember how much I had. What do I do?",
        a: "Make your best honest guess. You aren’t asked to know what you can’t know. Many scholars advise guessing a little high, so you are sure the debt is covered; anything extra counts as charity.",
      },
      {
        q: "Do I pay the old amounts, or more because prices have gone up?",
        a: "Scholars differ. Many say you owe the amount that was due at the time. Others say to adjust when your currency has lost a lot of value, for example by working it out in gold. Giving more is always allowed.",
      },
      {
        q: "Does charity I already gave count?",
        a: "Most scholars say it counts only if you meant it as zakat when you gave it. Charity given without that intention is still rewarded, but it doesn’t settle zakat.",
      },
      {
        q: "Does last year’s unpaid zakat lower what I owe the next year?",
        a: "Some scholars say yes: unpaid zakat is a debt, so it comes off your savings before the next year is worked out, which makes the total a little lower. This tally doesn’t take it off, so it errs on the side of being sure.",
      },
      {
        q: "Can I pay it a little at a time?",
        a: "Pay as soon as you reasonably can. If you can’t pay it all at once, scholars allow paying what you can now and the rest as you are able. Keep a note of what you have paid, so you know when it is done.",
      },
    ],
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
      q: "Calculator or free ledger: what’s the difference?",
      a: "The calculator works out this year’s zakat in a few minutes, with no account; your figures stay in your browser. A free ledger keeps the whole year: it remembers when your year began, tells you when zakat is due, records what you give, and keeps your figures safe on any device. Start with the calculator; you can turn it into a ledger at any time.",
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
