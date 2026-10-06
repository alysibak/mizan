import type { Messages } from "./en";

const fr: Messages = {
  common: {
    nav: {
      calculator: "Calculateur",
      method: "Méthode",
      signIn: "Se connecter",
      openLedger: "Ouvrir un registre",
    },
    footer: {
      disclaimer:
        "Un outil d’estimation personnel, qui ne remplace pas l’avis des savants. Pour votre situation, consultez une personne de science qualifiée.",
      calculator: "Calculateur de zakat",
      nisab: "Le nisab aujourd’hui",
      toolsHeading: "Outils gratuits",
      aboutHeading: "À propos",
      inheritance: "Calculateur d’héritage",
      fitr: "Zakat al-Fitr",
      stocks: "Filtre d’actions halal",
      qurbani: "Parts de sacrifice (udhiya)",
      guides: "Guides de la zakat",
      method: "Comment les chiffres sont établis",
      trust: "Ce qui est vérifié",
      privacy: "Confidentialité",
      terms: "Conditions",
      languages: "Langue",
    },
    inEnglish: " (en anglais)",
  },

  landing: {
    metaTitle: "Mizan : calculateur de zakat et registre gratuits",
    metaDescription:
      "Un calculateur de zakat et un registre gratuits et privés. Comparez votre patrimoine au nisab, suivez le hawl selon le calendrier hégirien, notez votre zakat et vos aumônes, et clôturez chaque année avec un relevé clair.",
    eyebrow: "الميزان · la balance",
    title: "La zakat, calculée avec soin.",
    lede: "Un calculateur de zakat et un registre gratuits et privés. Pesez vos biens face au nisab avec les cours des métaux en direct, suivez votre hawl selon le calendrier hégirien, et clôturez chaque année avec un montant fiable.",
    ctaCalculate: "Calculer ma zakat",
    ctaLedger: "Ouvrir un registre gratuit",
    trustLine:
      "Gratuit · Sans publicité · Sans lien bancaire · Exportez ou supprimez vos données à tout moment",
    sample: {
      aria: "Exemple de résultat de zakat",
      due: "Zakat due",
      summary: "2,5 % de {net}, au-dessus du nisab de l’argent",
      cash: "Espèces et banque",
      gold: "Or, 40 g en 22 carats",
      funds: "Fonds à long terme, 25 % de {amount}",
      debts: "Dettes exigibles",
      caption: "Chiffres d’exemple.",
    },
    featuresEyebrow: "Toute l’année de la zakat",
    featuresTitle: "Bien plus qu’un calcul ponctuel",
    featuresLede:
      "La plupart des calculateurs vous oublient dès que vous fermez l’onglet. Mizan garde votre année : quand votre hawl a commencé, ce que vous possédez, ce que vous avez donné et ce qui reste dû.",
    features: [
      {
        title: "Le nisab du jour",
        body: "Les cours de l’or et de l’argent dans votre monnaie, avec les deux étalons côte à côte. Vous choisissez celui qui s’applique.",
      },
      {
        title: "Votre hawl, selon le calendrier hégirien",
        body: "Comptez l’année lunaire à partir du jour où vos biens ont atteint le nisab, selon le calendrier tabulaire ou Umm al-Qura, avec un rappel dans votre propre agenda.",
      },
      {
        title: "Un registre qui connaît la zakat",
        body: "Espèces, or et argent au poids et au carat, actions, cryptomonnaies, stock commercial, créances et avoirs dans d’autres monnaies.",
      },
      {
        title: "Tous vos dons au même endroit",
        body: "Zakat, sadaqa, zakat al-fitr et purification, avec les huit catégories de bénéficiaires. Voyez ce qui est payé et ce qui reste dû pour ce cycle.",
      },
      {
        title: "Clôturer l’année avec soin",
        body: "Figez les chiffres de l’année, imprimez un relevé, lancez le hawl suivant et laissez une lettre à vous-même pour l’an prochain.",
      },
      {
        title: "Sur votre téléphone",
        body: "Installez-le depuis le navigateur comme une application. Thème clair et sombre, lisible par tous, sans passer par une boutique d’applications.",
      },
    ],
    honestEyebrow: "Franc sur les divergences",
    honestTitle: "Votre école, vos choix",
    honestBody:
      "Là où les savants divergent (nisab de l’or ou de l’argent, bijoux portés, actions à long terme, épargne retraite, dettes), Mizan montre la divergence et vous laisse choisir, au lieu de décider à votre place. C’est un outil d’estimation, pas une fatwa, et il le dit.",
    privateEyebrow: "Privé dès la conception",
    privateTitle: "Votre patrimoine reste le vôtre",
    privateItems: [
      "Pas de publicité, pas de revente de données, pas d’identifiants bancaires.",
      "Le calculateur fonctionne dans votre navigateur et n’enregistre rien sur un serveur.",
      "Les mots de passe sont hachés ; un seul cookie vous garde connecté.",
      "Téléchargez tout, ou supprimez votre compte, quand vous le souhaitez.",
    ],
    privacyLink: "Politique de confidentialité",
    questionsTitle: "Questions fréquentes",
    moreQuestions: "Plus de questions",
    finalTitle: "Connaissez votre zakat avant la fin du Ramadan.",
  },

  calculatorPage: {
    metaTitle: "Calculateur de zakat — gratuit, privé, sans inscription",
    metaDescription:
      "Calculez votre zakat en quelques minutes avec les cours de l’or et de l’argent en direct. Nisab de l’or ou de l’argent, bijoux selon l’école, actions, cryptomonnaies et dettes. Gratuit, privé, et rien de ce que vous saisissez n’est enregistré sur un serveur.",
    eyebrow: "Calculateur de zakat",
    title: "Combien devez-vous cette année ?",
    lede: "Indiquez ce que vous possédez et ce que vous devez aujourd’hui. Mizan le pèse face au nisab avec les cours des métaux en direct et vous donne un montant en quelques minutes. Gratuit, sans compte, et rien de ce que vous saisissez ne quitte votre navigateur.",
    howTitle: "Comment le calcul fonctionne",
    how: [
      {
        title: "1. Additionner",
        body: "Chaque bien est compté à sa valeur du jour. Les actions à long terme et l’épargne retraite ne comptent que pour la part que vous fixez ; les bijoux portés suivent l’école que vous choisissez.",
      },
      {
        title: "2. Déduire",
        body: "Les dettes exigibles sont soustraites. Le reste constitue votre patrimoine net soumis à la zakat.",
      },
      {
        title: "3. Peser",
        body: "S’il atteint le nisab, la zakat est de 2,5 % pour une année lunaire. En dessous du nisab, rien n’est dû.",
      },
    ],
    faqTitle: "Les questions qu’on se pose",
    faqFooter:
      "Le calcul est transparent : {method} et {trust}. Pour votre situation, consultez une personne de science qualifiée.",
    appName: "Calculateur de zakat Mizan",
  },

  calc: {
    step: "Étape {n}",
    pricesTitle: "Les cours du jour",
    pricesLede:
      "Le nisab dépend du cours de l’or ou de l’argent. Il est rempli à partir d’une source publique gratuite lorsqu’elle répond ; comparez-le au marché local.",
    currency: "Monnaie",
    goldPerGram: "Or, au gramme",
    silverPerGram: "Argent, au gramme",
    fetching: "Récupération des cours du jour…",
    pricesUnavailable:
      "Les cours en direct sont indisponibles. Saisissez les prix du gramme d’aujourd’hui.",
    livePricesFrom: "Cours en direct de {source}, {when}.",
    pricesFetched: "Cours récupérés le {when}.",
    refreshPrices: "Actualiser les cours",
    fetchPrices: "Obtenir les cours en direct",
    nisabStandard: "Étalon du nisab",
    silverTitle: "Argent · 595 g",
    silverDetailWithValue: "{amount} — le seuil le plus bas, donc plus de donateurs",
    silverDetail: "Le seuil le plus bas, donc plus de donateurs",
    goldTitle: "Or · 85 g",
    goldDetail: "Le seuil le plus élevé",
    ownTitle: "Ce que vous possédez",
    ownLede:
      "La valeur actuelle de ce que vous avez détenu pendant une année lunaire. Laissez vide ce qui ne vous concerne pas. Votre logement, votre voiture et les objets d’usage ne comptent pas.",
    oweTitle: "Ce que vous devez maintenant",
    oweLede:
      "Les factures, le loyer, les cartes de crédit et les échéances de prêt exigibles sont déduits. Un prêt immobilier n’est pas déduit en entier ; pour le reste, les savants divergent.",
    debtsDueNow: "Dettes exigibles",
    yearBasis: "Année de référence",
    lunarTitle: "Année lunaire (hégirienne) · 2,5 %",
    lunarDetail: "L’année selon laquelle la zakat se calcule.",
    solarTitle: "Année solaire · 2,577 %",
    solarDetail: "Si vous payez à une date grégorienne, ajusté pour l’année plus longue.",
    resultLabel: "Votre zakat",
    needsSilverPrice: "Saisissez le cours de l’argent du jour pour comparer au nisab.",
    needsGoldPrice: "Saisissez le cours de l’or du jour pour comparer au nisab.",
    enterHoldings: "Indiquez ce que vous possédez pour voir ce qui est dû.",
    dueSummarySilver: "{rate} de {net}, qui atteint ou dépasse le nisab de l’argent.",
    dueSummaryGold: "{rate} de {net}, qui atteint ou dépasse le nisab de l’or.",
    noneDue: "Aucune zakat due",
    belowSummarySilver: "{net} est inférieur de {gap} au nisab de l’argent ({nisab}).",
    belowSummaryGold: "{net} est inférieur de {gap} au nisab de l’or ({nisab}).",
    shareOf: "{share} de {amount}",
    netWealth: "Patrimoine net soumis à la zakat",
    nisabSilver: "Nisab (argent)",
    nisabGold: "Nisab (or)",
    weightPriceMissing: "Un bien est saisi au poids, mais son prix au gramme manque.",
    hawlNote:
      "La zakat est due sur les biens restés au niveau du nisab ou au-dessus pendant une année lunaire complète (le hawl). Ceci est une estimation, pas une fatwa.",
    print: "Imprimer ou enregistrer en PDF",
    clear: "Effacer",
    clearConfirm: "Effacer tout ce que vous avez saisi ?",
    keepTitle: "Conservez-le dans un registre",
    keepBody:
      "Un compte gratuit compte votre hawl selon le calendrier hégirien, vous prévient quand la zakat est due, enregistre vos dons et clôture chaque année avec un relevé. Ces chiffres vous suivent.",
    keepNote: "Le registre est pour l’instant en anglais.",
    keepCta: "Créer un registre gratuit",
    barDue: "Zakat due",
    barBelow: "Sous le nisab",
    byValue: "Saisir une valeur à la place",
    byWeight: "Saisir au poids à la place",
    jewelleryQuestion: "Compter les bijoux portés ?",
    jewelleryNo: "Non comptés (malikites, chaféites, hanbalites)",
    jewelleryYes: "Comptés (hanafites)",
    grams: "{label}, en grammes",
    gramUnit: "g",
    purity: "{label}, titre",
    countedShare: "Part comptée",
    karat: "{k} carats ({fineness})",
    fineSilver: "Fin (999)",
    sterling: "Sterling (925)",
    fields: {
      cash: { label: "Espèces", hint: "Billets et pièces chez vous ou dans votre portefeuille." },
      bank: {
        label: "Soldes bancaires",
        hint: "Comptes courants, d’épargne et de dépôt. N’incluez pas les intérêts perçus : donnez-les à part.",
      },
      gold: { label: "Or d’épargne", hint: "Pièces, lingots et or acheté comme placement." },
      silver: { label: "Argent d’épargne", hint: "Pièces, lingots et argent acheté comme placement." },
      jewellery: {
        label: "Bijoux en or portés",
        hint: "Comptés ou non selon le choix ci-dessous.",
      },
      trading: {
        label: "Actions et fonds de négoce",
        hint: "Achetés pour être revendus : comptés à leur valeur de marché du jour.",
      },
      crypto: { label: "Cryptomonnaies", hint: "À leur valeur de marché du jour." },
      longterm: {
        label: "Actions et fonds à long terme",
        hint: "Détenus pour la croissance et les dividendes. Seule une part de la valeur compte ; fixez celle que vous suivez.",
      },
      business: {
        label: "Stock commercial à vendre",
        hint: "À son prix de vente actuel, pas à son coût.",
      },
      receivables: {
        label: "Créances",
        hint: "Prêts dont vous attendez le remboursement. Excluez les créances douteuses.",
      },
      pension: {
        label: "Épargne retraite disponible",
        hint: "Les avis divergent beaucoup. Fixez la part que vous suivez, ou excluez-la si vous ne pouvez pas y accéder.",
      },
      other: {
        label: "Autres biens soumis à la zakat",
        hint: "Revenus locatifs épargnés, caution qui vous sera rendue, etc.",
      },
    },
  },

  nisabPage: {
    indexMetaTitle: "Le nisab aujourd’hui : nisab de l’or et de l’argent dans votre monnaie",
    indexMetaDescription:
      "Le nisab de la zakat aujourd’hui dans soixante monnaies, selon l’étalon argent (595 g) et l’étalon or (85 g), d’après les cours des métaux en direct. Mis à jour toutes les heures.",
    indexTitle: "Le nisab aujourd’hui",
    indexLede:
      "Le montant minimal de biens à partir duquel la zakat est due, aux cours de l’or et de l’argent du jour. Mis à jour toutes les heures.",
    currencyMetaTitle: "Le nisab aujourd’hui : {currency} ({code})",
    currencyMetaDescription:
      "Le nisab de la zakat aujourd’hui ({currency}) : {silver} selon l’étalon argent (595 g) et {gold} selon l’étalon or (85 g). Mis à jour toutes les heures.",
    currencyTitle: "Le nisab aujourd’hui : {currency}",
    silverLabel: "Nisab de l’argent · 595 g",
    goldLabel: "Nisab de l’or · 85 g",
    asOf: "Cours de {source}, {when}. Mis à jour toutes les heures ; comparez-les au marché local.",
    unavailable:
      "Les cours en direct sont indisponibles pour le moment. Réessayez bientôt, ou saisissez les cours du jour dans le calculateur.",
    explainer:
      "Si vos biens, dettes exigibles déduites, atteignent le nisab que vous suivez et que vous les détenez depuis une année lunaire, une zakat de 2,5 % est due sur leur totalité. De nombreux savants recommandent l’étalon argent, plus bas, pour que davantage de personnes s’acquittent de la zakat.",
    cta: "Calculer ma zakat en {code}",
    tableCurrency: "Monnaie",
    tableSilver: "Nisab de l’argent",
    tableGold: "Nisab de l’or",
    allCurrencies: "Toutes les monnaies",
    otherCurrencies: "Le nisab dans d’autres monnaies",
  },

  faq: [
    {
      q: "Qu’est-ce que le nisab ?",
      a: "Le nisab est le montant minimal de biens à partir duquel la zakat est due. Il est fixé en poids de métal précieux : 85 grammes d’or ou 595 grammes d’argent. Sa valeur en monnaie varie avec le cours du métal ; elle se calcule donc le jour où vous faites vos comptes.",
    },
    {
      q: "Faut-il prendre le nisab de l’or ou de l’argent ?",
      a: "Les deux sont établis par la Sunna, mais leurs valeurs sont aujourd’hui très éloignées. De nombreux savants contemporains et organismes de zakat recommandent le nisab de l’argent pour les liquidités et les patrimoines mixtes, car il est plus bas : davantage de personnes s’acquittent de la zakat et davantage parvient aux nécessiteux. D’autres retiennent l’or. Mizan affiche les deux et vous laisse choisir.",
    },
    {
      q: "Qu’est-ce que le hawl ?",
      a: "Le hawl est une année lunaire (hégirienne), soit environ 354 jours. La zakat est due sur les biens restés au niveau du nisab ou au-dessus pendant un hawl complet. Beaucoup choisissent un jour fixe, par exemple une date du Ramadan, et font chaque année le compte de tous leurs biens ce jour-là.",
    },
    {
      q: "Sur quoi la zakat est-elle due ?",
      a: "Les espèces, les soldes bancaires, l’or et l’argent, les actions et fonds, les cryptomonnaies, le stock commercial destiné à la vente et les créances dont vous attendez le remboursement. Votre logement, votre voiture, vos vêtements, vos meubles et les autres biens d’usage personnel ne comptent pas.",
    },
    {
      q: "Les bijoux sont-ils soumis à la zakat ?",
      a: "Les écoles divergent. L’école hanafite soumet à la zakat les bijoux en or et en argent, y compris ceux que l’on porte. Les écoles malikite, chaféite et hanbalite exemptent en général les bijoux destinés à la parure personnelle. Les bijoux détenus comme placement sont comptés par tous.",
    },
    {
      q: "Comment traiter les actions et l’épargne retraite ?",
      a: "Les actions achetées pour être revendues comptent pour leur pleine valeur de marché. Pour les placements à long terme, une méthode contemporaine courante ne compte que les actifs de l’entreprise soumis à la zakat par action, souvent estimés à environ un quart du cours. Pour l’épargne retraite, tout dépend de votre accès à l’argent ; demandez à une personne de confiance.",
    },
    {
      q: "Puis-je déduire mes dettes ?",
      a: "Les dettes exigibles, comme les factures, les soldes de carte de crédit et les échéances arrivées à terme, sont généralement déduites. Pour les dettes à long terme comme un prêt immobilier, de nombreux savants contemporains ne déduisent que ce qui est dû dans l’année à venir, et non la totalité du capital restant.",
    },
    {
      q: "Pourquoi le taux est-il de 2,577 % sur une année solaire ?",
      a: "La zakat est de 2,5 % par année lunaire. Une année solaire compte environ onze jours de plus ; si vous faites vos comptes à une date grégorienne, le taux est donc multiplié par 365,25 / 354,367, soit environ 2,577 %, pour rester juste dans la durée.",
    },
    {
      q: "Ce que je saisis est-il enregistré ou envoyé quelque part ?",
      a: "Le calculateur fonctionne dans votre navigateur. Vos chiffres restent dans le stockage de ce navigateur pour ne pas être perdus si vous rechargez la page, et vous pouvez les effacer à tout moment. La seule chose envoyée à Mizan est le code de votre monnaie, pour obtenir les cours des métaux du jour.",
    },
  ],
};

export default fr;
