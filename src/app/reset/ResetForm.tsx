"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

export default function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await sendJson(
      "/api/auth/reset",
      "POST",
      { token, newPassword: form.get("newPassword") },
      "Could not reset your password",
    );
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="label mb-1.5" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          className="field"
        />
      </div>
      <div>
        <label className="label mb-1.5" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          className="field"
        />
      </div>
      {error && (
        <p
          className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
