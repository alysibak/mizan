import type { ComponentType } from "react";
import {
  IconBook,
  IconBowl,
  IconCar,
  IconCash,
  IconChart,
  IconChild,
  IconCoins,
  IconCrypto,
  IconDome,
  IconGem,
  IconGiving,
  IconGlobe,
  IconGoldBar,
  IconHome,
  IconHourglass,
  IconJar,
  IconKey,
  IconLand,
  IconOwed,
  IconQuestion,
  IconReceipt,
  IconRing,
  IconShop,
  IconStar,
  IconStatement,
  IconUsers,
  IconYear,
} from "@/components/icons";

/**
 * A picture for each answer, by its key, so a list of questions can be
 * scanned by eye. Keys are the cases of "Do I pay zakat on…?" and "Can I
 * give zakat to…?"; a string key (not the component) lets the list travel
 * from a server page to the search in the browser.
 */
export const ANSWER_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  // Do I pay zakat on…?
  home: IconHome,
  car: IconCar,
  salary: IconCash,
  goals: IconJar,
  bullion: IconGoldBar,
  jewellery: IconRing,
  gems: IconGem,
  landToSell: IconLand,
  landToLive: IconHome,
  rental: IconKey,
  business: IconShop,
  lent: IconOwed,
  shares: IconChart,
  crypto: IconCrypto,
  pension: IconHourglass,
  bonds: IconStatement,
  // Can I give zakat to…?
  parents: IconUsers,
  children: IconChild,
  wife: IconRing,
  husband: IconRing,
  siblings: IconUsers,
  relatives: IconUsers,
  poor: IconBowl,
  debt: IconReceipt,
  student: IconBook,
  charity: IconGiving,
  mosque: IconDome,
  sayyid: IconStar,
  nonMuslim: IconGlobe,
  wealthy: IconCoins,
  employee: IconCash,
  // Other answers in the search: questions, missed years, Zakat al-Fitr, words.
  question: IconQuestion,
  missed: IconYear,
  fitr: IconBowl,
  word: IconBook,
};
