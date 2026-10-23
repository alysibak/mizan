import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import DemoButton from "@/components/DemoButton";
import { demoEmail } from "@/lib/demo";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Mizan zakat ledger.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  const hasDemo = Boolean(demoEmail());
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-6 inline-flex min-h-[44px] items-center self-start font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Welcome back</h1>

      <Suspense fallback={<p className="mt-8 text-sm text-sage">Loading…</p>}>
        <LoginForm google={googleEnabled()} />
      </Suspense>

      {hasDemo ? (
        <div className="mt-8 border-t border-mist pt-6">
          <DemoButton />
        </div>
      ) : null}
    </main>
  );
}
