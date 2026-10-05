"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import { track } from "@/lib/analytics";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await sendJson(
      "/api/auth/register",
      "POST",
      {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      },
      "Could not create your account",
    );
    if (res.ok) {
      track("Signup");
      router.push("/begin");
      router.refresh();
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label mb-1.5" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
            required
            className="field"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            className="field"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className="field"
          />
          <p className="mt-1.5 text-xs text-sage">
            8 to 72 characters. Mizan sends no email, so you will save a
            recovery code once you are in.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-xs leading-relaxed text-sage">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-pine underline-offset-2 hover:underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-pine underline-offset-2 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-sm text-sage">
        Already have an account?{" "}
        <Link href="/login" className="text-pine underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
