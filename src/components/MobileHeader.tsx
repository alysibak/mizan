"use client";

import Link from "next/link";
import { IconSettings, IconUsers } from "./icons";
import SiteMenu, { type MenuProps } from "./SiteMenu";

export default function MobileHeader({ isAdmin = false, menu }: { isAdmin?: boolean; menu: MenuProps }) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b border-mist bg-porcelain/90 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      {/* The page says where you are, in its heading and the tabs below. */}
      <Link href="/" className="inline-flex min-h-[44px] items-center font-serif text-2xl tracking-tight text-ink">
        Mizan
      </Link>
      <div className="flex items-center gap-1">
        <SiteMenu {...menu} />
        {isAdmin && (
          <Link
            href="/admin/users"
            aria-label="Visitors"
            className="-mr-1 rounded-card p-2 text-sage transition active:bg-mist/60"
          >
            <IconUsers className="h-6 w-6" />
          </Link>
        )}
        <Link
          href="/settings"
          aria-label="Settings"
          className="-me-1 flex h-11 w-11 items-center justify-center rounded-card text-sage transition active:bg-mist/60"
        >
          <IconSettings className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}
