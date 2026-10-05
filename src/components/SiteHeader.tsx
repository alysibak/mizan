import Link from "next/link";

/** Header for the public pages: landing, calculator, method, trust, legal. */
export default function SiteHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 md:px-10">
      <Link href="/" className="font-serif text-2xl tracking-tight text-ink">
        Mizan
      </Link>
      <nav className="flex items-center gap-4 text-sm sm:gap-6">
        <Link href="/calculator" className="hidden text-sage hover:text-ink sm:inline">
          Calculator
        </Link>
        <Link href="/method" className="hidden text-sage hover:text-ink md:inline">
          Method
        </Link>
        <Link href="/login" className="text-sage hover:text-ink">
          Sign in
        </Link>
        <Link href="/register" className="btn-primary">
          Open a ledger
        </Link>
      </nav>
    </header>
  );
}
