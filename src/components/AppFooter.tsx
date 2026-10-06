import Link from "next/link";

const LINKS = [
  { href: "/guides", label: "Guides" },
  { href: "/nisab", label: "Nisab today" },
  { href: "/method", label: "How the numbers are made" },
  { href: "/trust", label: "What is verified" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** Inside the app, the way to the public pages that the home page's footer would show. */
export default function AppFooter() {
  return (
    <footer className="mt-16 border-t border-mist pt-5 print:hidden">
      <nav aria-label="About Mizan">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-sage">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
