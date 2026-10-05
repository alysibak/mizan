import Link from "next/link";

const LINKS = [
  { href: "/calculator", label: "Zakat calculator" },
  { href: "/method", label: "How the numbers are made" },
  { href: "/trust", label: "What is verified" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** Footer for the public pages. */
export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-mist px-5 py-10 text-sm md:px-10 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-serif text-xl text-ink">Mizan</p>
          <p className="mt-2 text-xs leading-relaxed text-sage">
            A personal estimation aid, not a substitute for scholarly guidance.
            For your situation, consult a qualified person of knowledge.
          </p>
        </div>
        <nav aria-label="Site">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 md:grid-cols-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sage hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
