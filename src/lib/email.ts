import "server-only";
import { appendFile } from "fs/promises";
import { siteUrl } from "./site";

// Optional email: confirmation links, password-reset links, and hawl-day
// reminders. Off unless the deployment configures a way to send:
//
//   RESEND_API_KEY + EMAIL_FROM   send through Resend's HTTP API
//   EMAIL_OUTBOX_FILE + EMAIL_FROM append each message to a local file as a
//                                 JSON line (development and tests; nothing
//                                 leaves the machine)
//
// Messages are plain text and never carry amounts or anything else from the
// ledger: a date, a link, and the person's first name at most.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

function from(): string | null {
  return process.env.EMAIL_FROM?.trim() || null;
}

/**
 * An absolute link into the site for an email. Built from the configured
 * address, never from a request's Host header, which a client can forge to
 * send someone a reset link that leads elsewhere.
 */
export function emailLink(path: string): string {
  return new URL(path, siteUrl()).toString();
}

function siteConfigured(): boolean {
  return Boolean(
    process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
  );
}

export function emailEnabled(): boolean {
  if (!from() || !siteConfigured()) return false;
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_OUTBOX_FILE?.trim());
}

/** Send one message. False when email is off or the provider refused it. */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const sender = from();
  if (!sender) return false;

  const outbox = process.env.EMAIL_OUTBOX_FILE?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: sender, to: [message.to], subject: message.subject, text: message.text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return true;
      // The status only: the body can echo the address.
      console.error(JSON.stringify({ level: "error", message: "email send refused", status: res.status }));
      return false;
    } catch (err) {
      console.error(
        JSON.stringify({ level: "error", message: "email send failed", error: (err as Error).name }),
      );
      return false;
    }
  }
  if (outbox) {
    await appendFile(outbox, `${JSON.stringify({ from: sender, ...message, at: new Date().toISOString() })}\n`);
    return true;
  }
  return false;
}
