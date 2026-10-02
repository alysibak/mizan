"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

function ChangePassword() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setError("The new passwords do not match.");
      setBusy(false);
      return;
    }
    const res = await sendJson(
      "/api/account/password",
      "POST",
      {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      },
      "Could not change your password",
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    formEl.reset();
    setMessage("Password changed. Other devices have been signed out.");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-serif text-base text-ink">Change password</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label mb-1.5" htmlFor="currentPassword">
            Current
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className="field"
            required
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="newPassword">
            New
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            className="field"
            required
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="confirmPassword">
            Confirm new
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            className="field"
            required
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-gain">{message}</p>}
      <button type="submit" className="btn-ghost" disabled={busy}>
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

function SignOutOthers() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    const res = await sendJson("/api/account/sessions", "DELETE", undefined, "Could not sign out other devices");
    setBusy(false);
    setMessage(res.ok ? "Every other device is signed out." : res.error);
  }

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-base text-ink">Other devices</h3>
      <p className="text-sm text-sage">
        Lost a phone or signed in somewhere shared? End every session except
        this one.
      </p>
      <button type="button" className="btn-ghost" disabled={busy} onClick={run}>
        {busy ? "Signing out…" : "Sign out other devices"}
      </button>
      {message && <p className="text-sm text-sage">{message}</p>}
    </div>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("confirm") !== "DELETE") {
      setError("Type DELETE to confirm.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await sendJson(
      "/api/account",
      "DELETE",
      { password: form.get("password") },
      "Could not delete your account",
    );
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <h3 className="font-serif text-base text-ink">Delete account</h3>
        <p className="text-sm text-sage">
          Removes your ledger, giving, frozen years, and settings from this
          server for good. Download a backup first if you may want it later.
        </p>
        <button type="button" className="btn-danger" onClick={() => setOpen(true)}>
          Delete my account…
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-danger/30 bg-danger/5 p-4">
      <h3 className="font-serif text-base text-danger">Delete account</h3>
      <p className="text-sm text-sage">
        This cannot be undone. Everything stored for this account is erased.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label mb-1.5" htmlFor="deletePassword">
            Your password
          </label>
          <input
            id="deletePassword"
            name="password"
            type="password"
            autoComplete="current-password"
            className="field"
            required
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="deleteConfirm">
            Type DELETE
          </label>
          <input
            id="deleteConfirm"
            name="confirm"
            autoComplete="off"
            autoCapitalize="characters"
            className="field"
            required
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-danger" disabled={busy}>
          {busy ? "Deleting…" : "Delete everything"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Keep my account
        </button>
      </div>
    </form>
  );
}

/** Password, sessions, and erasure — the account's own controls. */
export default function AccountPanel({ email }: { email: string }) {
  return (
    <section className="card space-y-8 p-5">
      <div>
        <h2 className="font-serif text-lg text-ink">Account</h2>
        <p className="mt-1 text-sm text-sage">Signed in as {email}.</p>
      </div>
      <ChangePassword />
      <SignOutOthers />
      <DeleteAccount />
    </section>
  );
}
