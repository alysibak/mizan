import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col px-6 py-24">
        <p className="label text-brassDeep">404</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">Nothing on this page</h1>
        <p className="mt-4 leading-relaxed text-sage">
          The address may be mistyped, or the page has moved. Your ledger is
          untouched.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-primary">
            Go to your balance
          </Link>
          <Link href="/calculator" className="btn-ghost">
            Zakat calculator
          </Link>
        </div>
      </main>
    </div>
  );
}
