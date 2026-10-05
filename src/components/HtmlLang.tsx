"use client";

import { useEffect } from "react";

/**
 * Sets the document's language and direction while a translated page is
 * shown (the root layout renders English), and restores them on the way out.
 */
export default function HtmlLang({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
  useEffect(() => {
    const root = document.documentElement;
    const before = { lang: root.lang, dir: root.dir };
    root.lang = lang;
    root.dir = dir;
    return () => {
      root.lang = before.lang;
      root.dir = before.dir;
    };
  }, [lang, dir]);
  return null;
}
