import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

/** Header for the public pages: landing, calculator, method, trust, legal. */
export default function SiteHeader({ locale = "en" }: { locale?: Locale }) {
  const { nav } = messagesFor(locale).common;
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 md:px-10">
      <Link href={localePath(locale, "/")} className="font-serif text-2xl tracking-tight text-ink">
        Mizan
      </Link>
      <nav className="flex items-center gap-4 text-sm sm:gap-6">
        <Link
          href={localePath(locale, "/calculator")}
          className="hidden text-sage hover:text-ink sm:inline"
        >
          {nav.calculator}
        </Link>
        <Link href="/method" className="hidden text-sage hover:text-ink md:inline">
          {nav.method}
        </Link>
        <Link href="/login" className="text-sage hover:text-ink">
          {nav.signIn}
        </Link>
        <Link href="/register" className="btn-primary">
          {nav.openLedger}
        </Link>
      </nav>
    </header>
  );
}
