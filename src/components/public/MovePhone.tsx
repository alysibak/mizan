"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { renderSVG } from "uqr";
import { sendJson } from "@/lib/client-fetch";
import { readStoredValue, setStoredValue } from "@/lib/client-store";
import { BACKUP_KEYS, backupFile, readBackup } from "@/lib/my-zakat";
import { MOVE_MINUTES, makeCode, moveId, readCode, seal, showCode, unseal } from "@/lib/move";

/** Whether this phone keeps anything a copy would replace. */
function keepsAnything(): boolean {
  return BACKUP_KEYS.some((k) => readStoredValue(k) !== null);
}

/**
 * Bring a copy from the old phone: collect it once with the code, open it
 * here, and put each kept thing back. Resolves to a message for the visitor.
 */
export async function bringFromOldPhone(code: string): Promise<{ ok: boolean; message: string }> {
  if (keepsAnything() && !window.confirm("This phone already keeps some figures. Replace them with the ones from your old phone?")) {
    return { ok: false, message: "Nothing was changed." };
  }
  try {
    return await collect(code);
  } catch {
    return { ok: false, message: "That copy could not be opened here. Try “Restore a copy” with a saved file instead." };
  }
}

async function collect(code: string): Promise<{ ok: boolean; message: string }> {
  const res = await sendJson<{ sealed: string }>(
    "/api/move/claim",
    "POST",
    { id: await moveId(code) },
    "Could not reach Mizan. Check your connection and try again.",
  );
  if (!res.ok) return { ok: false, message: res.error };
  const opened = await unseal(code, res.data.sealed);
  const data = opened ? readBackup(opened) : null;
  if (!data) return { ok: false, message: "That copy could not be opened. Make a new code on your old phone." };
  for (const [key, value] of Object.entries(data)) setStoredValue(key, value);
  return { ok: true, message: "Brought over. Everything from your old phone is here." };
}

/**
 * "Move to a new phone": the old phone seals everything Mizan keeps and shows
 * a code and a picture to scan; the new phone types the code or scans it.
 * Works without an account, once, for half an hour.
 */
export default function MovePhone() {
  const [sent, setSent] = useState<{ code: string; qr: string; link: string } | null>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // The Menu links here (/my#move); the page draws this only once it has read
  // the phone, after the browser has already looked for the spot.
  useEffect(() => {
    if (window.location.hash === "#move") document.getElementById("move")?.scrollIntoView({ block: "start" });
  }, []);

  async function send() {
    setBusy(true);
    setStatus(null);
    const code = makeCode();
    let res: Awaited<ReturnType<typeof sendJson>>;
    try {
      const sealed = await seal(code, backupFile(readStoredValue, new Date()));
      res = await sendJson("/api/move", "POST", { id: await moveId(code), sealed }, "Could not make a code. Please try again.");
    } catch {
      res = { ok: false, error: "This browser cannot seal a copy. Use “Save a copy” instead.", status: 0 };
    }
    setBusy(false);
    if (!res.ok) {
      setStatus({ ok: false, message: res.error });
      return;
    }
    const link = `${window.location.origin}/my?move=${code}`;
    const qr = renderSVG(link, { border: 1, ecc: "M", blackColor: "#14302a", whiteColor: "#ffffff" }).replace(
      "<svg",
      '<svg aria-hidden="true" focusable="false"',
    );
    setSent({ code, qr, link });
    setTyping(false);
  }

  async function receive(e: React.FormEvent) {
    e.preventDefault();
    const code = readCode(typed);
    if (!code) {
      setStatus({ ok: false, message: "A code is 8 letters and numbers, like K7P4-QX2M. Check it and try again." });
      return;
    }
    setBusy(true);
    setStatus(null);
    const result = await bringFromOldPhone(code);
    setBusy(false);
    setStatus(result);
    if (result.ok) {
      setTyping(false);
      setTyped("");
    }
  }

  return (
    <section id="move" className="mt-5 scroll-mt-24 border-t border-mist pt-4" aria-labelledby="move-title">
      <h3 id="move-title" className="font-serif text-xl text-ink">
        Getting a new phone?
      </h3>
      <p className="mt-1 text-base text-sage">
        Move everything to it with a code. No account, and only eight letters and numbers to type.
      </p>

      {sent ? (
        <div className="mt-3 border-2 border-pine/40 bg-pine/5 p-4" role="status">
          <p className="text-sm text-sage">On your new phone, scan this with the camera:</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div
              className="h-36 w-36 shrink-0 bg-surface [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={`A picture to scan that opens ${sent.link}`}
              dangerouslySetInnerHTML={{ __html: sent.qr }}
            />
            <div>
              <p className="text-sm text-sage">Or open My zakat there, tap “I have a code”, and type:</p>
              <p className="mt-1 font-mono text-3xl tracking-wider text-pine" dir="ltr">
                {showCode(sent.code)}
              </p>
              <p className="mt-1 text-xs text-sage">Works once, for the next {MOVE_MINUTES} minutes.</p>
            </div>
          </div>
        </div>
      ) : null}

      {typing ? (
        <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={receive}>
          <div className="min-w-0 flex-1">
            <label className="label mb-1.5" htmlFor="move-code">
              The code from your old phone
            </label>
            <input
              id="move-code"
              className="field font-mono text-lg uppercase tracking-wider"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="K7P4-QX2M"
              maxLength={12}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              dir="ltr"
            />
          </div>
          <button type="submit" className="btn-primary min-h-[48px] px-5 text-base" disabled={busy}>
            {busy ? "Bringing it…" : "Bring it here"}
          </button>
        </form>
      ) : null}

      {status ? (
        <p className={"mt-3 text-sm font-medium " + (status.ok ? "text-pine" : "text-danger")} role={status.ok ? "status" : "alert"}>
          {status.message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className="btn-primary px-5 py-3 text-base" onClick={() => void send()} disabled={busy}>
          {sent ? "Make a new code" : "Move to a new phone"}
        </button>
        {typing ? null : (
          <button
            type="button"
            className="btn-ghost px-5 py-3 text-base"
            onClick={() => {
              setTyping(true);
              setStatus(null);
            }}
          >
            I have a code
          </button>
        )}
      </div>
    </section>
  );
}

const noSubscribe = () => () => {};

/** The code in "?move=…", "" for a bare "?move", or null when there is none. */
function linkCode(): string | null {
  const v = new URLSearchParams(window.location.search).get("move");
  return v === null ? null : v;
}

/**
 * Arriving from the old phone's picture (/my?move=CODE): one tap brings
 * everything over. A bare /my?move, or `asked`, asks for the code instead.
 */
export function MoveFromLink({ asked = false }: { asked?: boolean }) {
  // The page's own "bring it over" button asks for the form without a link.
  const raw = useSyncExternalStore(noSubscribe, linkCode, () => null) ?? (asked ? "" : null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [closed, setClosed] = useState(false);

  if (raw === null || closed) {
    return status?.ok ? (
      <p className="border-2 border-pine/40 bg-pine/5 p-4 text-base font-medium text-pine" role="status">
        {status.message}
      </p>
    ) : null;
  }
  const fromLink = readCode(raw);

  function leave() {
    window.history.replaceState(null, "", "/my");
    setClosed(true);
  }

  async function bring(e?: React.FormEvent) {
    e?.preventDefault();
    const code = fromLink ?? readCode(typed);
    if (!code) {
      setStatus({ ok: false, message: "A code is 8 letters and numbers, like K7P4-QX2M. Check it and try again." });
      return;
    }
    setBusy(true);
    setStatus(null);
    const result = await bringFromOldPhone(code);
    setBusy(false);
    setStatus(result);
    if (result.ok) leave();
  }

  return (
    <section className="border-2 border-pine/50 bg-pine/5 p-5" aria-labelledby="move-link-title">
      <h2 id="move-link-title" className="font-serif text-2xl text-ink">
        From your old phone
      </h2>
      {fromLink ? (
        <>
          <p className="mt-2 text-base text-sage">
            Bring your zakat day, figures, payments and record from your old phone to this one. Code{" "}
            <span className="font-mono text-ink" dir="ltr">
              {showCode(fromLink)}
            </span>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn-primary px-5 py-3 text-base" onClick={() => void bring()} disabled={busy}>
              {busy ? "Bringing it…" : "Bring it here"}
            </button>
            <button type="button" className="btn-ghost px-5 py-3 text-base" onClick={leave} disabled={busy}>
              Not now
            </button>
          </div>
        </>
      ) : (
        <form className="mt-2" onSubmit={bring}>
          <p className="text-base text-sage">
            On your old phone, open My zakat and tap “Move to a new phone”. Then type the code it shows.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="label mb-1.5" htmlFor="move-link-code">
                The code from your old phone
              </label>
              <input
                id="move-link-code"
                className="field font-mono text-lg uppercase tracking-wider"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="K7P4-QX2M"
                maxLength={12}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                dir="ltr"
              />
            </div>
            <button type="submit" className="btn-primary min-h-[48px] px-5 text-base" disabled={busy}>
              {busy ? "Bringing it…" : "Bring it here"}
            </button>
            <button type="button" className="btn-ghost min-h-[48px] px-4 text-base" onClick={leave} disabled={busy}>
              Not now
            </button>
          </div>
        </form>
      )}
      {status && !status.ok ? (
        <p className="mt-3 text-sm font-medium text-danger" role="alert">
          {status.message}
        </p>
      ) : null}
    </section>
  );
}
