import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import DemoButton from "@/components/DemoButton";
import { demoEmail } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Mizan zakat ledger.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  const hasDemo = Boolean(demoEmail());
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-sage">
        Sign in to pick up where your accounting left off.
      </p>

      <Suspense
        fallback={
          <p className="mt-8 text-sm text-sage">Loading sign-in form…</p>
        }
      >
        <LoginForm />
      </Suspense>

      {hasDemo ? (
        <div className="mt-8 border-t border-mist pt-6">
          <p className="mb-3 text-sm text-sage">
            Just looking? Open a sample ledger with a year of holdings and giving.
          </p>
          <DemoButton />
        </div>
      ) : null}
    </main>
  );
}
