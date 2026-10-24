/**
 * When a page breaks in someone's browser, tell whoever runs Mizan, so a
 * fault is found before anyone has to report it. Only the error's message,
 * where in the code, and the page's address are sent: never what was typed.
 */
const SENT_KEY = "mizan-crash-sent";

/** Noise that is not Mizan's fault: browser extensions, cross-origin scripts, layout warnings. */
export function worthReporting(message: string, source: string | undefined, origin: string): boolean {
  if (!message || message === "Script error." || /ResizeObserver loop/.test(message)) return false;
  if (source && !source.startsWith(origin) && !source.startsWith("/")) return false;
  return true;
}

/** "TypeError: x is undefined (at /_next/static/chunks/123.js:4:567)", short, without query strings. */
export function crashNote(message: string, source?: string, line?: number, column?: number): string {
  const where = source ? ` (at ${source.split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/, "")}${line ? `:${line}:${column ?? 0}` : ""})` : "";
  return `${message.slice(0, 400)}${where}`.slice(0, 600);
}

/** Send one report, once per message per tab; never throws. */
export function sendCrash(note: string): void {
  try {
    const sent = new Set((sessionStorage.getItem(SENT_KEY) ?? "").split("\n").filter(Boolean));
    if (sent.has(note) || sent.size >= 5) return;
    sent.add(note);
    sessionStorage.setItem(SENT_KEY, [...sent].join("\n"));
  } catch {
    /* private mode: sent, perhaps twice */
  }
  const body = JSON.stringify({
    kind: "crash",
    note,
    page: window.location.pathname,
    locale: document.documentElement.lang || "en",
  });
  try {
    if (navigator.sendBeacon?.("/api/problems", new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  fetch("/api/problems", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(
    () => {},
  );
}
