"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSettings } from "./icons";

const TITLES: [string, string][] = [
  ["/dashboard", "Balance"],
  ["/assets", "Assets"],
  ["/zakat", "Zakat"],
  ["/giving", "Giving"],
  ["/screening", "Screening"],
  ["/settings", "Settings"],
];

export default function MobileHeader() {
  const pathname = usePathname();
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Mizan";

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b border-mist bg-porcelain/90 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-lg text-ink">{title}</span>
        <span className="font-serif text-sm text-brass">Mizan</span>
      </div>
      <Link
        href="/settings"
        aria-label="Settings"
        className="-mr-1 rounded-lg p-2 text-sage transition active:bg-mist/60"
      >
        <IconSettings className="h-6 w-6" />
      </Link>
    </header>
  );
}
