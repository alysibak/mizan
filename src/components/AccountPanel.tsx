"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import EmailPanel, { type EmailState } from "@/components/EmailPanel";
import TwoFactorPanel from "@/components/TwoFactorPanel";

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

function RecoveryCode({ hasCode, emailOn }: { hasCode: boolean; emailOn: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await sendJson<{ code: string }>(
      "/api/account/recovery-code",
      "POST",
      { password: form.get("password") },
      "Could not make a recovery code",
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCode(res.data.code);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-base text-ink">Recovery code</h3>
      <p className="text-sm text-sage">
        {emailOn
          ? "A recovery code gets you back in even without your email. "
          : "This server sends no email. A recovery code is how you get back in if you forget your password. "}
        Keep it somewhere safe, like a password manager.
        {hasCode && !code ? " You have one; making a new one cancels it." : ""}
      </p>
      {code ? (
        <div className="space-y-2 border border-pine/30 bg-pine/5 p-4">
          <p className="text-sm text-ink">Save this now. It will not be shown again.</p>
          <p className="select-all break-all font-mono text-lg tracking-wider text-ink">{code}</p>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
              } catch {
                /* select-all lets the user copy by hand */
              }
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : open ? (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label mb-1.5" htmlFor="recoveryPassword">
              Your password
            </label>
            <input
              id="recoveryPassword"
              name="password"
              type="password"
              autoComplete="current-password"
              className="field"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Making…" : "Make code"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
          {hasCode ? "Make a new recovery code" : "Make a recovery code"}
        </button>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Password, sessions, and erasure — the account's own controls. */
export default function AccountPanel({
  email,
  hasRecoveryCode,
  recovered = false,
  twoFactor = false,
  twoFactorTurnedOff = false,
  mail = null,
}: {
  email: string;
  hasRecoveryCode: boolean;
  /** Just signed in with a recovery code, which is now used up. */
  recovered?: boolean;
  twoFactor?: boolean;
  /** The recovery code also turned two-step sign-in off. */
  twoFactorTurnedOff?: boolean;
  /** Set when this server sends email. */
  mail?: EmailState | null;
}) {
  return (
    <section id="account" className="card scroll-mt-20 space-y-8 p-5">
      <div>
        <h2 className="font-serif text-lg text-ink">Account</h2>
        <p className="mt-1 text-sm text-sage">Signed in as {email}.</p>
      </div>
      {recovered && (
        <p className="border border-brass/40 bg-brass/5 px-4 py-3 text-sm text-ink" role="status">
          Password reset. Your recovery code is used up — make a new one below.
          {twoFactorTurnedOff
            ? " Two-step sign-in is off; set it up again with your new phone."
            : ""}
        </p>
      )}
      {mail ? <EmailPanel email={email} state={mail} /> : null}
      <RecoveryCode hasCode={hasRecoveryCode} emailOn={Boolean(mail)} />
      <TwoFactorPanel enabled={twoFactor} />
      <ChangePassword />
      <SignOutOthers />
      <DeleteAccount />
    </section>
  );
}
