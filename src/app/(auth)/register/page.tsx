import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import { emailEnabled } from "@/lib/email";

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
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-sage">
        Free and private. Your wealth data is yours alone: no ads, no bank
        linking, and you can export or delete it at any time.
      </p>
      {from === "calculator" ? (
        <p className="mt-4 border border-pine/30 bg-pine/5 px-3 py-2 text-sm text-ink">
          Your calculator figures stay in this browser and are offered to you
          in the last setup step.
        </p>
      ) : null}
      <RegisterForm emailLinks={emailEnabled()} />
    </main>
  );
}
