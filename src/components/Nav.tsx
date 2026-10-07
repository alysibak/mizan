"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBalance,
  IconLedger,
  IconYear,
  IconGiving,
  IconTools,
  IconSettings,
  IconSignOut,
  IconUsers,
} from "./icons";
import { signOut } from "./SignOutButton";

const LINKS = [
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

export default function Nav({
  name,
  isAdmin = false,
}: {
  name: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-mist bg-paper/80 px-3 py-6 md:flex">
      <div className="mb-10 px-3">
        <Link href="/dashboard" className="font-serif text-2xl tracking-tight text-ink">
          Mizan
        </Link>
        <p className="mt-1 text-xs text-sage">{name}</p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {LINKS.map(({ href, label, Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m));
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition " +
                (active
                  ? "border-pine bg-pine/5 font-medium text-pine"
                  : "border-transparent text-sage hover:border-mist hover:text-ink")
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin/users"
            className={
              "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition " +
              (pathname.startsWith("/admin")
                ? "border-pine bg-pine/5 font-medium text-pine"
                : "border-transparent text-sage hover:border-mist hover:text-ink")
            }
          >
            <IconUsers className="h-5 w-5" />
            Visitors
          </Link>
        )}
      </nav>

      <div className="mt-auto space-y-0.5 border-t border-mist pt-4">
        <Link
          href="/settings"
          className={
            "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition " +
            (pathname.startsWith("/settings")
              ? "border-pine bg-pine/5 font-medium text-pine"
              : "border-transparent text-sage hover:text-ink")
          }
        >
          <IconSettings className="h-5 w-5" />
          Settings
        </Link>
        <Link
          href="/trust"
          className="block border-l-2 border-transparent px-3 py-2 text-xs text-sage hover:text-ink"
        >
          What is verified
        </Link>
        <Link
          href="/method"
          className="block border-l-2 border-transparent px-3 py-2 text-xs text-sage hover:text-ink"
        >
          How numbers are made
        </Link>
        <Link
          href="/privacy"
          className="block border-l-2 border-transparent px-3 py-2 text-xs text-sage hover:text-ink"
        >
          Privacy
        </Link>
        <button
          type="button"
          onClick={() => void signOut(router)}
          className="flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-left text-sm text-sage transition hover:text-danger"
        >
          <IconSignOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
