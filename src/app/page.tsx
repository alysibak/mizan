import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-serif text-xl tracking-tight text-ink">Mizan</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-sage hover:text-ink">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Create account
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="label mb-5 text-brass">الميزان · the balance</p>
        <h1 className="font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
          Your wealth is a trust.
          <br />
          Weigh it with care.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-sage">
          Mizan helps you reckon your zakat against nisab, keep your assets
          accounted for, and record what you give. It runs on your own machine
          with a local database, so nothing here can lapse or be switched off.
        </p>

        <div className="my-10 max-w-xl">
          <div className="balance-rule" />
        </div>

        <dl className="grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <dt className="font-serif text-2xl text-pine nums">2.5%</dt>
            <dd className="mt-1 text-sm text-sage">
              The rate on qualifying wealth, with a solar-year adjustment built in.
            </dd>
          </div>
          <div>
            <dt className="font-serif text-2xl text-pine nums">85g / 595g</dt>
            <dd className="mt-1 text-sm text-sage">
              Gold and silver nisab, shown side by side so the threshold is yours
              to choose.
            </dd>
          </div>
          <div>
            <dt className="font-serif text-2xl text-pine">Hawl</dt>
            <dd className="mt-1 text-sm text-sage">
              The lunar holding year tracked on the Hijri calendar, to the day.
            </dd>
          </div>
        </dl>

        <div className="mt-12">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Begin
          </Link>
        </div>
      </section>

      <footer className="border-t border-mist py-6 text-xs leading-relaxed text-sage">
        Mizan is a personal estimation aid, not a substitute for scholarly
        guidance. Scholars differ on several rulings reflected here. For your
        specific situation, consult a qualified person of knowledge.
      </footer>
    </main>
  );
}
