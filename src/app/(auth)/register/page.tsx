"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    if (res.ok) {
      router.push("/settings?welcome=1");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create your account");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-sage">
        Everything stays in a local database on your machine.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label mb-1.5" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" type="text" required className="field" />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="field" />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="field"
          />
          <p className="mt-1.5 text-xs text-sage">At least 8 characters.</p>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-sage">
        Already have an account?{" "}
        <Link href="/login" className="text-pine underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
