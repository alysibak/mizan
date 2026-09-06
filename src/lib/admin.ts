import "server-only";
import type { User } from "@/db/schema";

/**
 * Admin access is gated by ADMIN_EMAIL (comma-separated for multiple).
 * Set it in .env.local / Vercel to the email(s) you sign in with.
 */
export function isAdmin(user: Pick<User, "email"> | null | undefined): boolean {
  if (!user?.email) return false;
  const raw = process.env.ADMIN_EMAIL ?? "";
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(user.email.trim().toLowerCase());
}
