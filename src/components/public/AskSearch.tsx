"use client";

import { useState, useSyncExternalStore } from "react";
import AnswerList, { type AnswerItem } from "@/components/public/AnswerList";
import type { ShareLabels } from "@/components/public/ShareButton";
import { searchEntries } from "@/lib/search";
import type { Messages } from "@/i18n/messages/en";
import type { Locale } from "@/i18n/config";

export interface AnswerGroup {
  key: string;
  title: string;
  items: AnswerItem[];
}

/**
 * Every answer on the site, folded by topic until someone types; then one
 * list of what matches. Without scripts every topic can still be opened.
 */
export default function AskSearch({
  groups,
  m,
  locale,
  listen,
  stop,
  share,
  evidenceSuffix,
}: {
  groups: AnswerGroup[];
  m: Messages["ask"];
  locale: Locale;
  listen: string;
  stop: string;
  share: { label: string; labels: ShareLabels; path: string };
  evidenceSuffix?: string;
}) {
  // A search started elsewhere (the menu) arrives as ?q=; typing takes over from it.
  const fromUrl = useSyncExternalStore(
    () => () => {},
    () => (new URLSearchParams(window.location.search).get("q") ?? "").slice(0, 80),
    () => "",
  );
  const [typed, setQuery] = useState<string | null>(null);
  const query = typed ?? fromUrl;
  const searching = query.trim().length > 1;
  const items = groups.flatMap((g) => g.items);
  const found = searching
    ? searchEntries(
        items.map((item) => ({ ...item, title: item.label, body: `${item.verdict ?? ""} ${item.answer}` })),
        query,
        locale,
      )
    : items;
  const list = (shown: AnswerItem[]) => (
    <AnswerList
      items={shown}
      lang={locale}
      listen={listen}
      stop={stop}
      more={m.more}
      share={share}
      evidenceSuffix={evidenceSuffix}
    />
  );

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
          {searching ? (
            found.length > 0 ? (
              list(found)
            ) : (
              <p role="status" className="text-base text-sage">
                {m.none}
              </p>
            )
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.key}>
                  <details className="group border border-mist bg-surface">
                    <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="text-lg font-medium text-ink">{g.title}</span>
                      <span className="flex items-center gap-3 text-sm text-sage">
                        <span className="nums">{g.items.length}</span>
                        <span className="text-xl transition group-open:rotate-45" aria-hidden>
                          +
                        </span>
                      </span>
                    </summary>
                    <div className="px-4">{list(g.items)}</div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
