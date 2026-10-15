/**
 * Charity that costs no money, each from the Quran or a hadith, with how
 * strong its source is. In English for now; like the rest of the evidence,
 * it wants a scholar's review before it is relied on.
 */
import type { Strength } from "@/content/evidence";

export interface Deed {
  key: string;
  /** What to do, in a few words. */
  title: string;
  text: string;
  ref: string;
  strength: Strength;
}

const ABU_HURAYRAH = "Sahih al-Bukhari and Sahih Muslim, from Abu Hurayrah";

export const DEEDS: Deed[] = [
  {
    key: "smile",
    title: "Smile at someone",
    text: "“Your smile in the face of your brother is sadaqah.”",
    ref: "Sunan al-Tirmidhi, from Abu Dharr; graded hasan",
    strength: "hasan",
  },
  {
    key: "word",
    title: "Say a kind word",
    text: "“A good word is sadaqah.”",
    ref: ABU_HURAYRAH,
    strength: "agreed",
  },
  {
    key: "road",
    title: "Move something harmful off the road",
    text: "“Removing something harmful from the road is sadaqah.”",
    ref: ABU_HURAYRAH,
    strength: "agreed",
  },
  {
    key: "help",
    title: "Help someone carry their load",
    text: "“Helping a man onto his mount, or lifting his things onto it for him, is sadaqah.”",
    ref: ABU_HURAYRAH,
    strength: "agreed",
  },
  {
    key: "peace",
    title: "Make peace between two people",
    text: "“Acting justly between two people is sadaqah.”",
    ref: ABU_HURAYRAH,
    strength: "agreed",
  },
  {
    key: "steps",
    title: "Walk to the prayer",
    text: "“Every step you take towards the prayer is sadaqah.”",
    ref: ABU_HURAYRAH,
    strength: "agreed",
  },
  {
    key: "dhikr",
    title: "Say SubhanAllah",
    text: "“Every tasbih is sadaqah, every takbir is sadaqah, every tahmid is sadaqah, every tahlil is sadaqah. Enjoining good is sadaqah, and forbidding evil is sadaqah.”",
    ref: "Sahih Muslim, from Abu Dharr",
    strength: "sahih",
  },
  {
    key: "duha",
    title: "Pray two rak‘ahs in the morning",
    text: "Every joint of your body owes a sadaqah each day, and “two rak‘ahs of Duha are enough for all of it.”",
    ref: "Sahih Muslim, from Abu Dharr",
    strength: "sahih",
  },
  {
    key: "plant",
    title: "Plant a tree or a seed",
    text: "“No Muslim plants a tree or sows a crop, and a bird, a person, or an animal eats from it, but it is sadaqah for him.”",
    ref: "Sahih al-Bukhari and Sahih Muslim, from Anas ibn Malik",
    strength: "agreed",
  },
  {
    key: "water",
    title: "Give someone water",
    text: "“Pouring water from your bucket into your brother’s bucket is sadaqah.”",
    ref: "Sunan al-Tirmidhi, from Abu Dharr; graded hasan",
    strength: "hasan",
  },
  {
    key: "guide",
    title: "Show someone the way",
    text: "“Guiding a man who has lost his way is sadaqah, and seeing for someone whose sight is poor is sadaqah.”",
    ref: "Sunan al-Tirmidhi, from Abu Dharr; graded hasan",
    strength: "hasan",
  },
  {
    key: "family",
    title: "Spend on your family",
    text: "“When a man spends on his family, hoping for its reward, it is sadaqah for him.”",
    ref: "Sahih al-Bukhari and Sahih Muslim, from Abu Mas‘ud al-Ansari",
    strength: "agreed",
  },
  {
    key: "food",
    title: "Share your food at home",
    text: "“You will be rewarded for whatever you spend seeking Allah’s pleasure, even the morsel you put in your wife’s mouth.”",
    ref: "Sahih al-Bukhari and Sahih Muslim, from Sa‘d ibn Abi Waqqas",
    strength: "agreed",
  },
  {
    key: "harm",
    title: "Hold back from harming anyone",
    text: "“Keep your harm away from people: that is a sadaqah from you to yourself.”",
    ref: "Sahih al-Bukhari and Sahih Muslim, from Abu Dharr",
    strength: "agreed",
  },
  {
    key: "date",
    title: "Give even half a date",
    text: "“Protect yourselves from the Fire, even with half a date; and whoever cannot find it, then with a good word.”",
    ref: "Sahih al-Bukhari and Sahih Muslim, from ‘Adi ibn Hatim",
    strength: "agreed",
  },
  {
    key: "respite",
    title: "Give someone more time to repay you",
    text: "“If the debtor is in hardship, give him time until it is easier for him; and to let it go as charity is better for you, if only you knew.”",
    ref: "Quran 2:280",
    strength: "quran",
  },
  {
    key: "teach",
    title: "Teach something useful",
    text: "“When a person dies, his deeds end except for three: an ongoing charity, knowledge that benefits others, or a righteous child who prays for him.”",
    ref: "Sahih Muslim, from Abu Hurayrah",
    strength: "sahih",
  },
  {
    key: "animal",
    title: "Be kind to an animal",
    text: "A man gave water to a thirsty dog, and Allah forgave him. They asked, “Is there reward for us even in animals?” He said, “In every living thing there is reward.”",
    ref: ABU_HURAYRAH,
    strength: "agreed",
  },
];

/** The same deed for everyone on a given day, a different one the next. */
export function deedOfTheDay(day: Date): Deed {
  const index = Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86_400_000);
  return DEEDS[((index % DEEDS.length) + DEEDS.length) % DEEDS.length];
}
