"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBalance,
  IconAssets,
  IconZakat,
  IconGiving,
  IconScreening,
  IconSettings,
  IconSignOut,
} from "./icons";

const LINKS = [
  { href: "/dashboard", label: "Balance", Icon: IconBalance },
  { href: "/assets", label: "Assets", Icon: IconAssets },
  { href: "/zakat", label: "Zakat", Icon: IconZakat },
  { href: "/giving", label: "Giving", Icon: IconGiving },
  { href: "/screening", label: "Screening", Icon: IconScreening },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

export default function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-mist bg-paper px-4 py-6 md:flex">
      <div className="mb-8">
        <Link href="/dashboard" className="font-serif text-xl text-ink">
          Mizan
        </Link>
        <p className="mt-1 text-xs text-sage">{name}</p>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition " +
                (active
                  ? "bg-pine/10 font-medium text-pine"
                  : "text-sage hover:bg-mist/50 hover:text-ink")
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-sage transition hover:text-danger"
      >
        <IconSignOut className="h-5 w-5" />
        Sign out
      </button>
    </aside>
  );
}
