// The public demo account. When DEMO_EMAIL names an account, anyone may sign
// into it (see /api/auth/demo) but nobody may change it, so one visitor can
// never lock, rename, empty, or delete the demo for the next.

export const DEMO_READ_ONLY =
  "The demo is read-only. Make a free account to keep your own.";

export function demoEmail(): string | null {
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isDemoUser(user: { email: string } | null | undefined): boolean {
  const demo = demoEmail();
  return Boolean(demo && user && user.email.trim().toLowerCase() === demo);
}
