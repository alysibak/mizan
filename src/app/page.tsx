import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserSettings } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    const settings = await getUserSettings(user.id);
    redirect(settings.setupComplete ? "/dashboard" : "/begin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-porcelain bg-pine-wash">
      <div
        className="pointer-events-none absolute inset-0 bg-grain opacity-80"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <span className="font-serif text-2xl tracking-tight text-ink">Mizan</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-sage hover:text-ink">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Begin
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-5.5rem)] max-w-5xl flex-col justify-center px-6 pb-16 pt-8 md:px-10">
        <p className="animate-fade-up font-serif text-sm tracking-[0.2em] text-brass">
          الميزان
        </p>
        <h1 className="animate-fade-up mt-4 font-serif text-6xl leading-[0.95] tracking-tight text-ink sm:text-7xl md:text-8xl">
          Mizan
        </h1>
        <p
          className="animate-fade-up mt-6 max-w-md text-lg leading-relaxed text-sage"
          style={{ animationDelay: "80ms" }}
        >
          Weigh what you hold against nisab. Close the lunar year with a clear
          figure for what you owe.
        </p>

        <div
          className="animate-fade-up my-12 max-w-lg"
          style={{ animationDelay: "140ms" }}
          aria-hidden
        >
          <LandingScale />
        </div>

        <div
          className="animate-fade-up flex flex-wrap items-center gap-4"
          style={{ animationDelay: "200ms" }}
        >
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Open a ledger
          </Link>
          <Link href="/method" className="text-sm text-pine hover:underline">
            How the numbers are made
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-t border-mist bg-paper/60 px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
          <div>
            <p className="font-serif text-3xl text-pine nums">2.5%</p>
            <p className="mt-2 text-sm text-sage">
              On qualifying wealth, with a solar-year adjustment when you reckon
              on the Gregorian calendar.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl text-pine nums">85g / 595g</p>
            <p className="mt-2 text-sm text-sage">
              Gold and silver nisab — you choose the standard and set the metal
              prices.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl text-pine">Hawl</p>
            <p className="mt-2 text-sm text-sage">
              One Hijri year from the day wealth crossed nisab. Tabular calendar
              may differ from moon-sighting by a day or two.
            </p>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-5xl text-xs leading-relaxed text-sage">
          Mizan is a personal estimation aid, not a substitute for scholarly
          guidance.{" "}
          <Link href="/trust" className="text-pine hover:underline">
            What is verified
          </Link>
          . For your situation, consult a qualified person of knowledge.
        </p>
      </section>
    </main>
  );
}

/** Decorative static scale for the landing — no live numbers. */
function LandingScale() {
  return (
    <div className="relative h-24">
      <div
        className="absolute left-1/2 top-4 h-px w-64 -translate-x-1/2 bg-ink/50 transition-transform duration-1000"
        style={{ transform: "translateX(-50%) rotate(-4deg)" }}
      >
        <span className="absolute -left-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
        <span className="absolute -right-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
      </div>
      <div className="absolute left-1/2 top-4 h-10 w-px -translate-x-1/2 bg-mist" />
      <div className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[16px] border-x-transparent border-b-ink/70" />
    </div>
  );
}
