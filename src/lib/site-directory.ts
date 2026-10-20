import { localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

export interface DirectoryItem {
  href: string;
  label: string;
  /** A key into the menu's pictures. */
  icon: string;
}

export interface DirectoryGroup {
  key: "work" | "give" | "learn" | "tools";
  title: string;
  items: DirectoryItem[];
}

/**
 * Every public page, grouped by what a visitor wants to do rather than by
 * kind of page, in the visitor's language. Pages in English only so far
 * are listed in English pages only, except Ramadan and the older tools,
 * which other languages mark as English.
 */
export function siteDirectory(locale: Locale): DirectoryGroup[] {
  const all = messagesFor(locale);
  const { choose } = all.landing;
  const { footer, inEnglish, nav, menu } = all.common;
  const to = (path: string) => localePath(locale, path);
  const en = locale === "en";
  const only = (items: DirectoryItem[]) => (en ? items : []);
  return [
    {
      key: "work",
      title: menu.work,
      items: [
        ...only([{ href: "/my", label: "My zakat: my year in one place", icon: "my" }]),
        { href: to("/start"), label: choose.start, icon: "start" },
        { href: to("/guide"), label: choose.guide, icon: "guide" },
        { href: to("/calculator"), label: nav.calculator, icon: "calculator" },
        ...only([
          { href: "/family", label: "Zakat for my family", icon: "family" },
          { href: "/shop", label: "Zakat on my shop", icon: "shop" },
          { href: "/farm", label: "Crops and animals", icon: "farm" },
        ]),
        { href: to("/missed-years"), label: choose.missed, icon: "missed" },
        { href: to("/zakat-al-fitr"), label: choose.fitr, icon: "fitr" },
      ],
    },
    {
      key: "give",
      title: menu.give,
      items: [
        { href: to("/who-can-receive"), label: choose.who, icon: "who" },
        ...only([{ href: "/give", label: "Where to give, and which charity", icon: "give" }]),
        { href: "/ramadan", label: footer.ramadan + inEnglish, icon: "ramadan" },
        ...only([{ href: "/sadaqah", label: "Charity without money", icon: "sadaqah" }]),
      ],
    },
    {
      key: "learn",
      title: menu.learn,
      items: [
        { href: to("/ask"), label: choose.ask, icon: "ask" },
        { href: to("/what-counts"), label: choose.counts, icon: "counts" },
        ...only([
          { href: "/quiz", label: "Zakat in ten questions", icon: "quiz" },
          { href: "/interest", label: "My bank paid me interest", icon: "interest" },
        ]),
        { href: to("/sources"), label: all.sources.nav, icon: "sources" },
      ],
    },
    {
      key: "tools",
      title: menu.tools,
      items: [
        { href: to("/nisab"), label: choose.nisab, icon: "nisab" },
        { href: "/inheritance", label: footer.inheritance + inEnglish, icon: "inheritance" },
        { href: "/halal-stocks", label: footer.stocks + inEnglish, icon: "stocks" },
        { href: "/qurbani", label: footer.qurbani + inEnglish, icon: "qurbani" },
        { href: to("/poster"), label: all.poster.nav, icon: "poster" },
        { href: to("/worksheet"), label: all.worksheet.nav, icon: "worksheet" },
      ],
    },
  ];
}
