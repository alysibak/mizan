import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { peekToken } from "@/lib/one-time-tokens";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Where an emailed reset link lands. The link is only used up on submit. */
export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const userId = await peekToken(token, "reset");
  const [owner] = userId
    ? await db
        .select({ totpSecret: users.totpSecret })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [];
  const live = Boolean(owner);
  const twoStep = Boolean(owner?.totpSecret);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Choose a new password</h1>
      {live ? (
        <>
          <p className="mt-2 text-sm text-sage">
            {twoStep
              ? "Saving it signs out every device. Then sign in with it and the code from your authenticator app."
              : "Saving it signs out every other device and signs you in here."}
          </p>
          <ResetForm token={token} />
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-sage">
            This link has expired or was already used. Links work once, for 30
            minutes.
          </p>
          <p className="mt-6">
            <Link href="/forgot" className="btn-primary">
              Ask for a new link
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
