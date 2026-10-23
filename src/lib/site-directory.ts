import { localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { readNeighboursMode } from "@/lib/neighbours";

export interface DirectoryItem {
  href: string;
  label: string;
  /** A key into the menu's pictures. */
  icon: string;
}

export interface DirectoryGroup {
  key: "work" | "give" | "learn";
  title: string;
  items: DirectoryItem[];
}

/**
 * The public pages worth a place in the Menu, grouped by what a visitor wants
 * to do, in the visitor's language. Pages in English only so far are listed
 * on English pages only.
 */
export function siteDirectory(locale: Locale): DirectoryGroup[] {
  const all = messagesFor(locale);
  const { choose } = all.landing;
  const { menu } = all.common;
  const to = (path: string) => localePath(locale, path);
  const en = locale === "en";
  const only = (items: DirectoryItem[]) => (en ? items : []);
  // Needs near you, once real partners are shown (English for now).
  const neighbours = readNeighboursMode(process.env.NEIGHBOURS) === "on";
  return [
    {
      key: "work",
      title: menu.work,
      items: [
        ...only([{ href: "/my", label: "My zakat", icon: "my" }]),
        { href: to("/guide"), label: choose.start, icon: "start" },
        ...only([
          { href: "/family", label: "Zakat for my family", icon: "family" },
          { href: "/shop", label: "Zakat on my shop", icon: "shop" },
          { href: "/farm", label: "Crops and animals", icon: "farm" },
        ]),
        { href: to("/missed-years"), label: choose.missed, icon: "missed" },
        ...only([{ href: "/debts", label: "Money I lent or borrowed", icon: "debts" }]),
        { href: to("/nisab"), label: choose.nisab, icon: "nisab" },
        ...only([{ href: "/my#move", label: "Move to a new phone", icon: "move" }]),
      ],
    },
    {
      key: "give",
      title: menu.give,
      items: [
        ...only(neighbours ? [{ href: "/neighbours", label: "Help a family near you", icon: "neighbours" }] : []),
        { href: to("/who-can-receive"), label: choose.who, icon: "who" },
        ...only([{ href: "/give", label: "Where to give, and which charity", icon: "give" }]),
        { href: to("/zakat-al-fitr"), label: choose.fitr, icon: "fitr" },
        ...only([
          { href: "/ramadan", label: "Ramadan: the last ten nights", icon: "ramadan" },
          { href: "/interest", label: "My bank paid me interest", icon: "interest" },
          { href: "/fasts", label: "Fasts I missed", icon: "fasts" },
          { href: "/sadaqah", label: "Charity without money", icon: "sadaqah" },
        ]),
      ],
    },
    {
      key: "learn",
      title: menu.learn,
      items: [
        { href: to("/ask"), label: choose.ask, icon: "ask" },
        { href: to("/what-counts"), label: choose.counts, icon: "counts" },
        ...only([{ href: "/quiz", label: "Zakat in ten questions", icon: "quiz" }]),
        { href: to("/sources"), label: all.sources.nav, icon: "sources" },
      ],
    },
  ];
}
