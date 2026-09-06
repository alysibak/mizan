"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBalance,
  IconLedger,
  IconYear,
  IconGiving,
  IconTools,
} from "./icons";

const TABS = [
  { href: "/dashboard", label: "Balance", Icon: IconBalance, match: ["/dashboard"] },
  { href: "/assets", label: "Ledger", Icon: IconLedger, match: ["/assets"] },
  {
    href: "/year",
    label: "Year",
    Icon: IconYear,
    match: ["/year", "/zakat", "/statement"],
  },
  { href: "/giving", label: "Give", Icon: IconGiving, match: ["/giving"] },
  {
    href: "/tools",
    label: "Tools",
    Icon: IconTools,
    match: ["/tools", "/screening", "/mirath"],
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-paper/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m));
          return (
            <li key={href}>
              <Link
                href={href}
                className={
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] transition active:bg-mist/40 " +
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
