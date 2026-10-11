"use client";

import { useState } from "react";
import AnswerList, { type AnswerItem } from "@/components/public/AnswerList";
import type { ShareLabels } from "@/components/public/ShareButton";
import { searchEntries } from "@/lib/search";
import type { Messages } from "@/i18n/messages/en";
import type { Locale } from "@/i18n/config";

/**
 * Every answer on the site in one list, narrowed as someone types. Without
 * scripts the whole list shows, so nothing is out of reach.
 */
export default function AskSearch({
  items,
  m,
  locale,
  listen,
  stop,
  share,
}: {
  items: AnswerItem[];
  m: Messages["ask"];
  locale: Locale;
  listen: string;
  stop: string;
  share: { label: string; labels: ShareLabels; path: string };
}) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 1;
  const found = searching
    ? searchEntries(
        items.map((item) => ({ ...item, title: item.label, body: `${item.verdict ?? ""} ${item.answer}` })),
        query,
        locale,
      )
    : items;

  return (
    <div className="space-y-8">
      <div role="search" className="max-w-xl">
        <label className="label mb-1.5" htmlFor="ask-q">
          {m.searchLabel}
        </label>
        <input
          id="ask-q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          className="field text-lg"
          placeholder={m.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section aria-labelledby="ask-results">
        <h2 id="ask-results" className="font-serif text-2xl text-ink">
          {searching ? m.resultsTitle : m.allTitle}
        </h2>
        <div className="mt-4">
          {found.length > 0 ? (
            <AnswerList items={found} lang={locale} listen={listen} stop={stop} more={m.more} share={share} />
          ) : (
            <p role="status" className="text-base text-sage">
              {m.none}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
