"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSettings, IconUsers } from "./icons";
import SiteMenu, { type MenuProps } from "./SiteMenu";

const TITLES: [string, string][] = [
  ["/tools/reckoning-night", "Close the year"],
  ["/tools/forgotten", "Anything forgotten?"],
  ["/tools/envelopes", "Give your zakat"],
  ["/tools/forgive", "Forgive"],
  ["/year/snapshots", "Saved year"],
  ["/dashboard", "Home"],
  ["/assets", "What I own"],
  ["/year", "Zakat"],
  ["/zakat", "How it is worked out"],
  ["/statement", "Statement"],
  ["/giving", "Give"],
  ["/settings", "Settings"],
  ["/admin/users", "Visitors"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/method", "How it works"],
];

export default function MobileHeader({ isAdmin = false, menu }: { isAdmin?: boolean; menu: MenuProps }) {
  const pathname = usePathname();
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Mizan";

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b border-mist bg-porcelain/90 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-2">
        <span className="font-serif text-lg text-ink">{title}</span>
        <Link href="/" className="inline-flex min-h-[44px] items-center font-serif text-sm text-brassDeep underline-offset-2 hover:underline">
          Mizan
        </Link>
      </div>
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
