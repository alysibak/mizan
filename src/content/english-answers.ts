/**
 * Answers from the pages that are in English only so far, for the English
 * "Ask a question" search, each leading to its page. Icon and evidence keys
 * match answerIcons.ts and evidence.ts.
 */
export interface EnglishAnswer {
  key: string;
  label: string;
  answer: string;
  href: string;
  page: string;
  evidence?: string;
}

export const ENGLISH_ANSWERS: EnglishAnswer[] = [
  {
    key: "crops",
    label: "My harvest: crops, grain, rice, dates",
    answer:
      "A tenth of the harvest if the land was watered by rain or a river, half a tenth if you paid for the water (a pump, a well), given at harvest once it reaches about 653 kg.",
    href: "/farm",
    page: "Crops and animals",
    evidence: "crops",
  },
  {
    key: "livestock",
    label: "My goats, sheep, cows, buffalo, or camels",
    answer:
      "Once a year, an animal from the herd: from 40 sheep or goats, 30 cows or buffalo, or 5 camels that graze freely for most of the year. Animals you feed, or keep for work, are not counted by most scholars.",
    href: "/farm",
    page: "Crops and animals",
    evidence: "livestock",
  },
  {
    key: "household",
    label: "My wife’s gold, my children’s savings: is it all added together?",
    answer:
      "No. Each person owes zakat on what is theirs, weighed against the nisab on their own. A wife’s jewellery and mahr are hers.",
    href: "/family",
    page: "Family zakat",
  },
  {
    key: "shopkeeper",
    label: "My shop or small business",
    answer:
      "Count the goods for sale at today’s price, the cash in the till and bank, and money customers owe you; take off what you owe suppliers now. The shop, shelves, and equipment are not counted.",
    href: "/shop",
    page: "Shop zakat",
    evidence: "business",
  },
  {
    key: "interest",
    label: "Interest my bank paid me",
    answer:
      "It is not yours to keep: give it all away, to the poor or to public good, hoping for no reward. It is not zakat, and you count your savings without it.",
    href: "/interest",
    page: "Bank interest",
    evidence: "interest",
  },
  {
    key: "giveWhere",
    label: "Where should I give my zakat? Which charity?",
    answer:
      "Start close: relatives in need, then neighbours, your town, and where need is greater. Ask a charity whether it keeps zakat apart and gives it only to the eight groups, and soon.",
    href: "/give",
    page: "Where to give",
    evidence: "giveNear",
  },
  {
    key: "sadaqah",
    label: "I have no money. Can I still give charity?",
    answer:
      "Yes. A smile, a kind word, moving something harmful off the road, giving water, and planting a tree are all sadaqah, named by the Prophet ﷺ.",
    href: "/sadaqah",
    page: "Sadaqah without money",
  },
  {
    key: "missedFasts",
    label: "I missed fasts in Ramadan",
    answer:
      "Make up each day you missed, one for one, before the next Ramadan if you can: after illness, travel, a period, or childbirth. Count what is left and tick each off as you fast it.",
    href: "/fasts",
    page: "Fasts I missed",
    evidence: "fasts-make-up",
  },
  {
    key: "fidya",
    label: "Too old or ill to fast: fidya",
    answer:
      "Someone who cannot fast and is not expected to be able to does not make the days up: they feed one poor person for each day instead. Many mosques announce the amount each Ramadan.",
    href: "/fasts",
    page: "Fasts I missed",
    evidence: "fidya",
  },
  {
    key: "kaffarah",
    label: "I broke a fast on purpose: kaffarah",
    answer:
      "Make the day up, repent, and fast sixty days in a row; only if you truly cannot, feed sixty poor people. Scholars differ on whether eating on purpose needs this, or only intercourse.",
    href: "/fasts",
    page: "Fasts I missed",
    evidence: "kaffarah",
  },
  {
    key: "oath",
    label: "I swore an oath and broke it",
    answer: "Feed or clothe ten poor people; only if you cannot, fast three days (Quran 5:89).",
    href: "/fasts",
    page: "Fasts I missed",
    evidence: "oath",
  },
  {
    key: "quiz",
    label: "Learn the basics of zakat quickly",
    answer: "Ten picture questions, each answered at once with the reason. It takes two minutes.",
    href: "/quiz",
    page: "Zakat quiz",
  },
];
