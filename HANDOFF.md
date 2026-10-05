# Handoff notes

State of the work, for whoever continues it.

## Verify everything

```bash
npm ci
npm run lint && npm run typecheck && npm test   # 205 unit tests
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
- Migrations through 0009 (index on the calendar-feed token).
- `npm start` serves the standalone build (`scripts/start.cjs`).
- Docker image no longer installs OS packages; APP_URL is a build argument.

## Not yet done

1. **Email.** Mizan sends none; recovery codes are the only reset path. For a
   mass audience this is the largest support risk. An optional provider
   (SMTP or Resend), off unless configured, would keep the no-expiry promise.
2. **Translations and right-to-left layout** (Arabic, Urdu, Bahasa, Turkish,
   French). The biggest reach lever. Start with the public pages.
3. **License.** There is no LICENSE file. Pick one before calling the code
   open source anywhere.
4. Live price sources were exercised only through mocks in tests (the build
   sandbox could not reach them). Check `/api/metals?currency=PKR` and
   `?currency=EUR` on the first deployment.
5. Tailwind 4 / ESLint 10 / Zod 4 majors are pending; each is its own change.

## Conventions

- Commit as the repo owner; no co-author trailers.
- Money is stored to the cent; add with `sumCents`.
- New schema: edit `src/db/schema.ts`, run `npx drizzle-kit generate`.
- Every new write route starts with `writableUser()` and reads its body with
  `readJson()`.
- Public pages go in `PUBLIC_PATHS` (`src/lib/analytics.ts`) and the sitemap;
  app pages stay out of both.
