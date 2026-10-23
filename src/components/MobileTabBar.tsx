"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBalance,
  IconLedger,
  IconYear,
  IconGiving,
} from "./icons";

const TABS = [
  { href: "/dashboard", label: "Home", Icon: IconBalance, match: ["/dashboard"] },
  { href: "/assets", label: "What I own", Icon: IconLedger, match: ["/assets", "/tools/forgive"] },
  {
    href: "/year",
    label: "Zakat",
    Icon: IconYear,
    match: ["/year", "/zakat", "/statement", "/tools/reckoning-night", "/tools/forgotten", "/tools/envelopes"],
  },
  { href: "/giving", label: "Give", Icon: IconGiving, match: ["/giving"] },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-paper/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m));
          return (
            <li key={href}>
              <Link
                href={href}
                className={
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[13px] transition active:bg-mist/40 " +
                  (active ? "text-pine" : "text-sage")
                }
              >
                <Icon className="h-6 w-6" />
                <span className={active ? "font-medium" : ""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
