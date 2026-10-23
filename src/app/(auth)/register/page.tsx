import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import GoogleButton from "@/components/GoogleButton";
import { googleEnabled } from "@/lib/google";

export const metadata: Metadata = {
  title: "Create your free account",
  description:
    "Open a private zakat ledger: track holdings, the hawl, and your giving. Free, with no ads and no bank linking.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const google = googleEnabled();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-6 inline-flex min-h-[44px] items-center self-start font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Make your free account</h1>
      <p className="mt-2 text-sm text-sage">Private. No ads, no bank linking.</p>
      {from === "calculator" ? (
        <p className="mt-4 border border-pine/30 bg-pine/5 px-3 py-2 text-sm text-ink">
          Your figures come with you.
        </p>
      ) : null}
      {google ? (
        <>
          <div className="mt-8">
            <GoogleButton />
          </div>
          <details className="mt-4">
            <summary className="text-base font-medium text-pine">Use your email instead</summary>
            <RegisterForm afterGoogle />
          </details>
          <p className="mt-6 text-sm text-sage">
            Already have an account?{" "}
            <Link href="/login" className="text-pine underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <RegisterForm />
      )}
    </main>
  );
}
