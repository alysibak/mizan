/**
 * The evidence behind each answer on "Do I pay zakat on…?" and "Can I give
 * zakat to…?", with how strong it is, and where scholars differ, each view
 * with its own evidence. In English for now.
 *
 * Hadith are named by collection and narrator rather than number, because
 * numbering differs between editions. Gradings follow the common verdicts
 * of hadith scholars; where they disagree, the evidence is marked
 * "disputed". This is a summary for ordinary readers, not a fatwa: anyone
 * unsure about their own case should ask a scholar they trust.
 */

export type Strength =
  | "quran"
  | "agreed"
  | "sahih"
  | "consensus"
  | "hasan"
  | "companions"
  | "disputed"
  | "weak"
  | "reasoning";

/** How much weight a piece of evidence carries, for the label and colour. */
export type Tier = "strong" | "sound" | "maybe";

export const STRENGTH: Record<Strength, { label: string; tier: Tier }> = {
  quran: { label: "Quran", tier: "strong" },
  agreed: { label: "Hadith in Bukhari and Muslim", tier: "strong" },
  sahih: { label: "Sahih hadith", tier: "strong" },
  consensus: { label: "Scholars agree", tier: "strong" },
  hasan: { label: "Hasan (sound) hadith", tier: "sound" },
  companions: { label: "Practice of the Companions", tier: "sound" },
  disputed: { label: "Hadith, grading disputed", tier: "maybe" },
  weak: { label: "Weak hadith", tier: "maybe" },
  reasoning: { label: "Scholars’ reasoning", tier: "maybe" },
};

export const TIER_LABEL: Record<Tier, string> = {
  strong: "Strong",
  sound: "Sound",
  maybe: "Maybe",
};

export interface Evidence {
  strength: Strength;
  /** What it says, in plain words. */
  text: string;
  /** Where it is found. */
  ref: string;
}

export interface View {
  /** Who holds it. */
  who: string;
  says: string;
  evidence: Evidence[];
}

export interface CaseEvidence {
  evidence: Evidence[];
  /** Where scholars differ: each view with its own evidence. */
  views?: View[];
}

// Evidence used by more than one answer.
const PERSONAL_USE: Evidence = {
  strength: "agreed",
  text: "“There is no zakat due from a Muslim on his slave or his horse.” Scholars take from it that things kept for your own use are not zakatable.",
  ref: "Sahih al-Bukhari and Sahih Muslim, from Abu Hurayrah",
};
const PERSONAL_USE_AGREED: Evidence = {
  strength: "consensus",
  text: "The four schools agree there is no zakat on a home you live in, or on clothes, furniture, and other things kept for use.",
  ref: "Reported in Ibn Qudamah, al-Mughni, and al-Nawawi, al-Majmu‘",
};
const YEAR: Evidence = {
  strength: "hasan",
  text: "“There is no zakat on wealth until a year has passed over it.” Some chains are weak, but it has several, and the Companions acted on it.",
  ref: "Sunan Ibn Majah, from ‘A’ishah; Sunan Abi Dawud, from ‘Ali; Sunan al-Tirmidhi, from Ibn ‘Umar",
};
const MUADH: Evidence = {
  strength: "agreed",
  text: "When sending Mu‘adh to Yemen: “Tell them Allah has made zakat a duty on their wealth, taken from their rich and given back to their poor.”",
  ref: "Sahih al-Bukhari and Sahih Muslim, from Ibn ‘Abbas",
};
const HOARD: Evidence = {
  strength: "quran",
  text: "“Those who hoard gold and silver and do not spend it in the way of Allah: give them news of a painful punishment.”",
  ref: "Quran 9:34–35",
};
const SILVER_NISAB: Evidence = {
  strength: "agreed",
  text: "“There is no zakat on less than five awaq of silver” (200 dirhams, about 595 grams).",
  ref: "Sahih al-Bukhari and Sahih Muslim, from Abu Sa‘id al-Khudri",
};
const TRADE_HADITH: Evidence = {
  strength: "disputed",
  text: "“The Messenger of Allah ﷺ used to tell us to pay zakat on what we prepared for sale.” Its chain is criticised, but it is supported by what follows.",
  ref: "Sunan Abi Dawud, from Samurah ibn Jundub",
};
const TRADE_UMAR: Evidence = {
  strength: "companions",
  text: "‘Umar told Hammas, a trader in leather, to value his goods and pay zakat on them.",
  ref: "Reported by al-Shafi‘i, ‘Abd al-Razzaq, and al-Bayhaqi",
};
const TRADE_AGREED: Evidence = {
  strength: "consensus",
  text: "Scholars agree that goods held for sale are zakatable at their value (only the Zahiri school differed).",
  ref: "Reported by Ibn al-Mundhir, al-Ijma‘",
};
const RIBA: Evidence = {
  strength: "quran",
  text: "“Allah has allowed trade and forbidden riba (interest)… give up what remains of riba, if you are believers.”",
  ref: "Quran 2:275–279",
};
const PURE: Evidence = {
  strength: "sahih",
  text: "“Allah is pure and accepts only what is pure.” So money that was never rightfully yours cannot count as your zakat.",
  ref: "Sahih Muslim, from Abu Hurayrah",
};
const EIGHT: Evidence = {
  strength: "quran",
  text: "“Zakat is only for the poor, the needy, those who work on it, those whose hearts are to be won, freeing captives, those in debt, in the way of Allah, and the stranded traveller.” The word “only” limits it to these eight.",
  ref: "Quran 9:60",
};
const RELATIVE_TWICE: Evidence = {
  strength: "hasan",
  text: "“Charity to the poor is charity; to a relative it is two: charity and keeping family ties.”",
  ref: "Sunan al-Tirmidhi, Sunan al-Nasa’i, and Sunan Ibn Majah, from Salman ibn ‘Amir",
};
const DUTY_TO_SUPPORT: Evidence = {
  strength: "consensus",
  text: "Scholars agree zakat is not given to those you are already bound to provide for, such as your parents and your children: the benefit would come back to you.",
  ref: "Reported by Ibn al-Mundhir, al-Ijma‘",
};
const NOT_RICH: Evidence = {
  strength: "sahih",
  text: "“There is no share in it for someone rich, nor for someone strong and able to earn.”",
  ref: "Sunan Abi Dawud and Sunan al-Nasa’i, from ‘Ubaydullah ibn ‘Adi; graded sahih",
};

export const EVIDENCE: Record<string, CaseEvidence> = {
  // Giving in the last ten nights of Ramadan.
  ramadan: {
    evidence: [
      {
        strength: "quran",
        text: "“The Night of Decree is better than a thousand months.”",
        ref: "Quran 97:3",
      },
      {
        strength: "sahih",
        text: "“Seek Laylat al-Qadr in the odd nights of the last ten nights of Ramadan.”",
        ref: "Sahih al-Bukhari, from ‘A’ishah",
      },
      {
        strength: "agreed",
        text: "The Prophet ﷺ was the most generous of people, and he was at his most generous in Ramadan.",
        ref: "Sahih al-Bukhari and Sahih Muslim, from Ibn ‘Abbas",
      },
      {
        strength: "reasoning",
        text: "Giving every night so that some falls on Laylat al-Qadr is encouraged by many scholars as a way to seek its reward. No text names a special reward for charity on that night beyond its being better than a thousand months.",
        ref: "Scholars’ advice, drawn from the texts above",
      },
    ],
  },

  // Do I pay zakat on…?
  home: { evidence: [PERSONAL_USE, PERSONAL_USE_AGREED] },
  car: {
    evidence: [
      PERSONAL_USE,
      {
        strength: "reasoning",
        text: "A horse was how people got about; a car kept for your own use is the closest thing to it today. Scholars apply the hadith to cars by this comparison.",
        ref: "Analogy (qiyas) drawn by contemporary scholars",
      },
      PERSONAL_USE_AGREED,
    ],
  },
  salary: {
    evidence: [
      YEAR,
      {
        strength: "companions",
        text: "Ibn ‘Umar said whoever gains wealth owes no zakat on it until a year has passed over it.",
        ref: "Sunan al-Tirmidhi (as Ibn ‘Umar’s own saying, with a sound chain)",
      },
      {
        strength: "hasan",
        text: "Al-‘Abbas asked to pay his zakat before its time, and the Prophet ﷺ allowed it. So counting everything on one zakat day, even money that has not had a full year, is allowed as paying early.",
        ref: "Sunan Abi Dawud and Sunan al-Tirmidhi, from ‘Ali",
      },
    ],
    views: [
      {
        who: "Most scholars, including the four schools",
        says: "No zakat is paid on each salary. What is left of it is counted with your savings on your zakat day.",
        evidence: [YEAR],
      },
      {
        who: "A few Companions and some contemporary scholars (for example Yusuf al-Qaradawi, Fiqh al-Zakah)",
        says: "Earned income can be paid on when it is received, without waiting a year.",
        evidence: [
          {
            strength: "reasoning",
            text: "Reported from Ibn ‘Abbas and Ibn Mas‘ud for money gained, and compared to crops, which are paid on at harvest. Most scholars did not follow it.",
            ref: "Discussed in Abu ‘Ubayd, al-Amwal, and al-Qaradawi, Fiqh al-Zakah",
          },
        ],
      },
    ],
  },
  goals: {
    evidence: [
      HOARD,
      MUADH,
      {
        strength: "consensus",
        text: "Money you hold is zakatable whatever you mean to spend it on later; a plan is not an exemption.",
        ref: "The position of the four schools",
      },
    ],
  },
  bullion: {
    evidence: [
      HOARD,
      SILVER_NISAB,
      {
        strength: "hasan",
        text: "“On two hundred dirhams held for a year, five dirhams are due… and nothing on gold until it reaches twenty dinars, then half a dinar.”",
        ref: "Sunan Abi Dawud, from ‘Ali",
      },
      {
        strength: "sahih",
        text: "“Any owner of gold or silver who does not pay what is due on it” will be punished with it on the Day of Judgement.",
        ref: "Sahih Muslim, from Abu Hurayrah",
      },
    ],
  },
  jewellery: {
    evidence: [HOARD],
    views: [
      {
        who: "The Hanafi school; among recent scholars Ibn Baz and Ibn ‘Uthaymin",
        says: "Zakat is due on gold and silver jewellery, even if worn.",
        evidence: [
          {
            strength: "disputed",
            text: "A woman came with her daughter wearing two heavy gold bracelets. The Prophet ﷺ asked, “Do you pay zakat on these?” She said no. He said, “Would you like Allah to put two bracelets of fire on you for them?” Graded hasan by some, weak by others.",
            ref: "Sunan Abi Dawud, Sunan al-Nasa’i, and Sunan al-Tirmidhi, from ‘Amr ibn Shu‘ayb",
          },
          {
            strength: "disputed",
            text: "‘A’ishah wore silver rings; the Prophet ﷺ asked whether she paid their zakat, and warned her when she said no.",
            ref: "Sunan Abi Dawud, from ‘A’ishah",
          },
        ],
      },
      {
        who: "The Maliki, Shafi‘i, and Hanbali schools",
        says: "Jewellery worn in the normal way is not zakatable, like other things kept for use.",
        evidence: [
          {
            strength: "companions",
            text: "‘A’ishah looked after her orphaned nieces, who had jewellery, and did not pay zakat on it.",
            ref: "Muwatta’ Malik",
          },
          {
            strength: "companions",
            text: "Ibn ‘Umar dressed his daughters in gold and did not pay zakat on it.",
            ref: "Muwatta’ Malik",
          },
          {
            strength: "weak",
            text: "“There is no zakat on jewellery.” Weak as the Prophet’s words; sound as the saying of the Companion Jabir.",
            ref: "Reported by al-Bayhaqi",
          },
          PERSONAL_USE,
        ],
      },
    ],
  },
  gems: {
    evidence: [
      {
        strength: "consensus",
        text: "Of precious things, the texts name only gold and silver. Pearls, rubies, and diamonds kept for wear or keeping are not zakatable.",
        ref: "The position of the four schools",
      },
      {
        strength: "companions",
        text: "Ibn ‘Abbas said there is no zakat on ambergris, a precious thing taken from the sea.",
        ref: "Sahih al-Bukhari (as a report without full chain)",
      },
      TRADE_AGREED,
    ],
  },
  landToSell: { evidence: [TRADE_HADITH, TRADE_UMAR, TRADE_AGREED] },
  landToLive: {
    evidence: [
      PERSONAL_USE,
      {
        strength: "reasoning",
        text: "Land counts as trade goods only if you bought it meaning to sell it. If you later decide to sell, many scholars count it from that decision; if you are undecided, most do not count it.",
        ref: "Ibn Qudamah, al-Mughni, chapter on trade goods",
      },
    ],
  },
  rental: {
    evidence: [
      {
        strength: "reasoning",
        text: "A building that earns rent is like a tool that earns a living: it is not for sale, so it is not counted. The rent, once saved, is money and is counted.",
        ref: "The position of the four schools",
      },
      YEAR,
    ],
    views: [
      {
        who: "Almost all scholars",
        says: "Only the rent you have saved by your zakat day is counted, with your other savings.",
        evidence: [YEAR],
      },
      {
        who: "Some contemporary scholars",
        says: "Rent can be paid on as it comes in, compared to crops (10% of the net rent).",
        evidence: [
          {
            strength: "reasoning",
            text: "An analogy with crops, discussed by al-Qaradawi in Fiqh al-Zakah. It has no direct text and is a minority view.",
            ref: "al-Qaradawi, Fiqh al-Zakah",
          },
        ],
      },
    ],
  },
  business: {
    evidence: [
      TRADE_HADITH,
      TRADE_UMAR,
      TRADE_AGREED,
      {
        strength: "reasoning",
        text: "The shop, its shelves, and its equipment are not for sale, so they are not counted.",
        ref: "The position of the four schools",
      },
    ],
  },
  lent: {
    evidence: [
      {
        strength: "companions",
        text: "‘Ali said of a debt that is sure to be repaid: pay its zakat when you receive it, for the years that have passed.",
        ref: "Abu ‘Ubayd, al-Amwal",
      },
    ],
    views: [
      {
        who: "Most scholars (Hanafi, Shafi‘i, Hanbali)",
        says: "A debt you expect back is zakatable every year; you may wait until it is repaid, then pay for each year.",
        evidence: [
          {
            strength: "companions",
            text: "The saying of ‘Ali above.",
            ref: "Abu ‘Ubayd, al-Amwal",
          },
        ],
      },
      {
        who: "The Maliki school",
        says: "Zakat on a debt is paid once, for one year, when it is repaid.",
        evidence: [
          {
            strength: "companions",
            text: "Reported from ‘Umar ibn ‘Abd al-‘Aziz, and the practice of the people of Madinah.",
            ref: "Muwatta’ Malik",
          },
        ],
      },
      {
        who: "Many scholars, for a debt you doubt you will see",
        says: "Nothing is due until it is repaid, then pay as above, or start a new year.",
        evidence: [
          {
            strength: "reasoning",
            text: "Money you may never get back is not fully in your hands, so it is not counted until it is.",
            ref: "Ibn Qudamah, al-Mughni",
          },
        ],
      },
    ],
  },
  shares: {
    evidence: [
      TRADE_AGREED,
      {
        strength: "reasoning",
        text: "Shares bought to sell on are trade goods, counted at market value. For shares kept long term, zakat is on the company’s zakatable assets (cash, stock, money owed to it) per share.",
        ref: "International Islamic Fiqh Academy (OIC), resolution on zakat of shares; AAOIFI Shari‘ah Standard on zakah",
      },
      {
        strength: "reasoning",
        text: "“A quarter of the share price” is a rough estimate used when the company’s figures are not to hand, not a rule. Use the real figure if you have it.",
        ref: "Common practice of zakat bodies",
      },
    ],
  },
  crypto: {
    evidence: [
      {
        strength: "reasoning",
        text: "Scholars differ on whether holding cryptocurrency is allowed at all. Those who allow it treat it like money or trade goods, at today’s value. There is no text on it directly.",
        ref: "Contemporary fatwas",
      },
      TRADE_AGREED,
    ],
  },
  pension: {
    evidence: [YEAR],
    views: [
      {
        who: "Many contemporary scholars",
        says: "Nothing is due while you cannot touch the money; pay once you can draw it.",
        evidence: [
          {
            strength: "reasoning",
            text: "Zakat needs full ownership and control (al-milk al-tamm). Money locked away is not yet fully yours.",
            ref: "The condition of full ownership, as set out in the four schools",
          },
        ],
      },
      {
        who: "Other contemporary scholars",
        says: "Count what you could take out today, after any penalty and tax.",
        evidence: [
          {
            strength: "reasoning",
            text: "If you can withdraw it, even at a cost, it is within your control, like a deposit you could break.",
            ref: "Contemporary fatwas",
          },
        ],
      },
    ],
  },
  bonds: { evidence: [RIBA, PURE, HOARD] },

  // Can I give zakat to…?
  parents: { evidence: [DUTY_TO_SUPPORT] },
  children: { evidence: [DUTY_TO_SUPPORT] },
  wife: {
    evidence: [
      {
        strength: "consensus",
        text: "Scholars agree a husband may not give his zakat to his wife, because providing for her is already his duty.",
        ref: "Reported by Ibn al-Mundhir, al-Ijma‘",
      },
    ],
  },
  husband: {
    evidence: [],
    views: [
      {
        who: "The Shafi‘i school, one view in the Hanbali school, and Abu Yusuf and Muhammad of the Hanafi school",
        says: "A wife may give her zakat to her husband if he is in need.",
        evidence: [
          {
            strength: "agreed",
            text: "Zaynab, the wife of Ibn Mas‘ud, asked if she could give to her husband and the orphans in her care. The Prophet ﷺ said she would have two rewards: for charity and for kinship.",
            ref: "Sahih al-Bukhari and Sahih Muslim, from Zaynab",
          },
        ],
      },
      {
        who: "Abu Hanifa, and the other view in the Hanbali school",
        says: "She may not, because the money would come back to her through his spending on her.",
        evidence: [
          {
            strength: "reasoning",
            text: "They read Zaynab’s question as being about voluntary charity, not zakat.",
            ref: "Ibn Qudamah, al-Mughni",
          },
        ],
      },
    ],
  },
  siblings: {
    evidence: [RELATIVE_TWICE, EIGHT],
    views: [
      {
        who: "Most scholars",
        says: "Yes, if they are in need.",
        evidence: [RELATIVE_TWICE],
      },
      {
        who: "One view in the Hanbali school",
        says: "Not if you are already legally bound to support them (for example as their heir).",
        evidence: [DUTY_TO_SUPPORT],
      },
    ],
  },
  relatives: { evidence: [RELATIVE_TWICE, EIGHT] },
  poor: { evidence: [EIGHT, MUADH] },
  debt: {
    evidence: [
      EIGHT,
      {
        strength: "sahih",
        text: "The Prophet ﷺ told Qabisah that asking is allowed for someone who has taken on a debt or burden, until it is paid.",
        ref: "Sahih Muslim, from Qabisah ibn Mukhariq",
      },
    ],
  },
  student: {
    evidence: [
      EIGHT,
      {
        strength: "reasoning",
        text: "A poor student who cannot earn because study takes their time is among the poor; scholars of the Shafi‘i and Hanbali schools say so expressly.",
        ref: "al-Nawawi, al-Majmu‘",
      },
    ],
  },
  charity: {
    evidence: [
      EIGHT,
      MUADH,
      {
        strength: "reasoning",
        text: "A charity passing on your zakat acts as your agent. It is valid once the money reaches people who may receive it, so ask how they use it.",
        ref: "Rules of agency (wakalah) in the four schools",
      },
    ],
  },
  mosque: {
    evidence: [EIGHT],
    views: [
      {
        who: "Most scholars, including the four schools",
        says: "No: “in the way of Allah” means those striving in Allah’s cause, not buildings.",
        evidence: [EIGHT],
      },
      {
        who: "A minority of scholars, past and present",
        says: "“In the way of Allah” covers all good works, mosques included.",
        evidence: [
          {
            strength: "reasoning",
            text: "A wider reading of the phrase in 9:60. Most scholars rejected it, because it would make the list of eight meaningless.",
            ref: "Discussed in al-Qaradawi, Fiqh al-Zakah",
          },
        ],
      },
    ],
  },
  sayyid: {
    evidence: [
      {
        strength: "sahih",
        text: "“Charity is not lawful for Muhammad or the family of Muhammad; it is the leftover of people’s wealth.”",
        ref: "Sahih Muslim, from ‘Abd al-Muttalib ibn Rabi‘ah",
      },
      {
        strength: "agreed",
        text: "Al-Hasan put a date of charity in his mouth and the Prophet ﷺ made him spit it out: “Do you not know that we do not eat charity?”",
        ref: "Sahih al-Bukhari and Sahih Muslim, from Abu Hurayrah",
      },
    ],
    views: [
      {
        who: "Most scholars",
        says: "No, they may not receive zakat.",
        evidence: [],
      },
      {
        who: "Some later Hanafi and Maliki scholars",
        says: "They may, when they are in need and cut off from the share set aside for them in the past.",
        evidence: [
          {
            strength: "reasoning",
            text: "Need, when their own share no longer reaches them.",
            ref: "Reported in later Hanafi and Maliki works",
          },
        ],
      },
    ],
  },
  nonMuslim: {
    evidence: [
      MUADH,
      {
        strength: "consensus",
        text: "Scholars agree zakat on wealth is not given to a non-Muslim from the share of the poor.",
        ref: "Reported by Ibn al-Mundhir, al-Ijma‘",
      },
    ],
    views: [
      {
        who: "Most scholars",
        says: "Help non-Muslims in need with sadaqah, not zakat.",
        evidence: [MUADH],
      },
      {
        who: "The Hanbali school, among others",
        says: "Zakat may go to a non-Muslim from the share of “those whose hearts are to be won”.",
        evidence: [EIGHT],
      },
    ],
  },
  wealthy: { evidence: [NOT_RICH, EIGHT] },
  employee: {
    evidence: [
      {
        strength: "reasoning",
        text: "Wages are a debt you owe for work done. Paying them from zakat would mean the zakat comes back to you, so it does not count.",
        ref: "The position of the four schools",
      },
      EIGHT,
    ],
  },
};
