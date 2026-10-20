"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu, IconQuestion, IconSearch } from "@/components/icons";
import { PAGE_ICONS as ICONS } from "@/components/pageIcons";
import type { DirectoryGroup } from "@/lib/site-directory";


/**
 * "Menu" at the top of every page: everything Mizan does, grouped by what
 * the visitor wants to do, as pictures. A native dialog, so Escape, the
 * back of the screen, and screen readers all behave as expected.
 */
export default function SiteMenu({
  labels,
  groups,
  search,
}: {
  labels: { open: string; close: string };
  groups: DirectoryGroup[];
  /** The answer search, in the page's language: where it is and its words. */
  search: { action: string; label: string; placeholder: string; button: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => dialog.current?.close();

  // A link inside opens a new page: the menu should not still be open there.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-[40px] items-center gap-1.5 border border-pine/40 px-2.5 text-sm font-medium text-pine transition hover:border-pine hover:bg-pine/5"
      >
        <IconMenu className="h-5 w-5" />
        {labels.open}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="site-menu-title"
        onClick={(e) => {
          // A tap on the dimmed backdrop, outside the panel, closes it.
          if (e.target === e.currentTarget) close();
        }}
        className="m-0 h-full max-h-none w-full max-w-none bg-paper p-0 text-ink backdrop:bg-ink/50 sm:m-auto sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:border sm:border-mist"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-mist bg-paper px-5 py-3">
          <h2 id="site-menu-title" className="font-serif text-2xl text-ink">
            {labels.open}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="flex h-11 w-11 items-center justify-center text-3xl leading-none text-sage hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="space-y-6 px-5 pb-8 pt-5">
          {/* Type a word, see every answer about it. */}
          <form action={search.action} method="get" role="search">
            <label className="label mb-1.5 block" htmlFor="menu-q">
              {search.label}
            </label>
            <div className="flex gap-2">
              <input
                id="menu-q"
                name="q"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder={search.placeholder}
                className="field min-w-0 flex-1 text-base"
              />
              <button type="submit" className="btn-primary min-h-[48px] shrink-0 px-4" aria-label={search.button}>
                <IconSearch className="h-5 w-5" />
              </button>
            </div>
          </form>
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`menu-${g.key}`}>
              <h3 id={`menu-${g.key}`} className="label text-brassDeep">
                {g.title}
              </h3>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {g.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? IconQuestion;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="card flex h-full min-h-[64px] items-center gap-3 px-3 py-2 transition hover:border-pine"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine"
                          aria-hidden
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium leading-snug text-ink">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </dialog>
    </>
  );
}
