import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
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
    </main>
  );
}
