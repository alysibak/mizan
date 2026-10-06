# Handoff notes

State of the work, for whoever continues it.

## Verify everything

```bash
npm ci
npm run lint && npm run typecheck && npm test   # 249 unit tests
npm run build && npm run test:e2e               # Playwright: phone + desktop + axe
```

CI (`.github/workflows/ci.yml`) runs all of that on pushes to `master` and on
pull requests, plus a runtime dependency audit, a fresh migration, a
schema-drift check, and a Docker build that must boot and pass `/api/health`.

## Done

- Next 16; runtime dependencies have 0 advisories (`npm run audit:prod`).
  Dev tooling has a `braces` advisory with no patched release (Tailwind 3,
  eslint-config-next); CI fails dev tooling only on critical.
- CI runs on `master` (it used to target `main`, so it never ran on pushes).
  `esbuild` is a direct dev dependency so Dependabot's lockfile updates pass
  `npm ci`.
- Public `/calculator` with live prices (gold-api.com, frankfurter.app, and a
  currency-api fallback for non-ECB currencies), carried into a new ledger at
  setup. Static landing page, privacy, terms, sitemap, robots, social card,
  JSON-LD, branded 404/error pages, optional Plausible on public pages.
- Read-only one-click demo (`DEMO_EMAIL`); seed resets it with real-looking
  prices.
- `src/lib/api.ts` guards every route: `signedInUser`, `writableUser` (refuses
  the demo), `confirmPassword` (shares the sign-in lockout), `overRowLimit`,
  `readJson` (size-capped). The proxy refuses oversized bodies.
- Migrations through 0012 (one-time tokens, email and reminder columns,
  two-step sign-in).
- Seven languages on the public pages (`src/i18n`): the message files are
  typed against English, and a unit test checks placeholders and gaps. Pages
  under `[locale]` and `nisab/[currency]` use `dynamicParams = false`;
  `instrumentation.ts` filters the spurious log line Next writes for each 404
  there.
- `/nisab` and `/nisab/{code}` (59 currencies × 7 languages, ISR hourly).
- Public tools: `/inheritance`, `/zakat-al-fitr`, `/halal-stocks`, `/qurbani`.
  The tool components take an optional `currency`; without it they show a
  currency picker and a sign-up nudge (visitor mode).
- Optional email (`src/lib/email.ts`): confirmation, reset links, hawl
  reminders via `/api/cron/reminders`. Off unless configured.
- Two-step sign-in (`src/lib/totp.ts`, `api/auth/login/two-factor`,
  `api/account/two-factor`).
- `npm start` serves the standalone build (`scripts/start.cjs`).
- Docker image no longer installs OS packages; APP_URL is a build argument.

## Not yet done

1. **Native-speaker review of the translations.** They were written
   carefully but not checked by native speakers; fiqh terms especially
   (e.g. Malay *uruf*, Urdu *sahib-e-nisab*) deserve a second reader.
2. **Translate the free tools and the signed-in app.** Tool pages and the
   ledger are English only; footer links say so in each language.
3. **Email provider.** Only Resend's HTTP API is wired (plus a file outbox
   for development). SMTP would need a dependency such as nodemailer.
4. **`<html lang>` on translated pages** is set after hydration; the content
   wrapper carries `lang`/`dir` from the server. A second root layout would
   fix the document element too, but needs Next's `global-not-found`, still
   experimental in 16.3.
5. **License.** There is no LICENSE file. Pick one before calling the code
   open source anywhere.
6. Live price sources were exercised only through mocks in tests (the build
   sandbox could not reach them). Check `/api/metals?currency=PKR` and
   `?currency=EUR` on the first deployment.
7. Tailwind 4 / ESLint 10 / Zod 4 majors are pending; each is its own change.
8. TOTP secrets are stored as-is (like most apps). Encrypting them with a
   server key would protect them in a stolen database backup.

## Conventions

- Commit as the repo owner; no co-author trailers.
- Money is stored to the cent; add with `sumCents`.
- New schema: edit `src/db/schema.ts`, run `npx drizzle-kit generate`.
- Every new write route starts with `writableUser()` and reads its body with
  `readJson()`.
- Public pages go in `PUBLIC_PATHS` (`src/lib/analytics.ts`) and the sitemap;
  app pages stay out of both. Free tools are listed once in
  `src/lib/public-tools.ts`.
- New public strings: add to `src/i18n/messages/en.ts`; TypeScript then
  requires every other language to have them.
- One-time secrets (email links, sign-in tickets) go through
  `src/lib/one-time-tokens.ts`; a password change calls `revokeSignInTokens`.
