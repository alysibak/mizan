# Handoff notes

State of the audit work on this branch, for whoever continues it.

## Verify everything

```bash
npm ci
npm run lint && npm run typecheck && npm test   # 130 unit tests
npm run build && npm run test:e2e               # Playwright, phone-size, needs Chromium
```

CI (`.github/workflows/ci.yml`) runs all of that plus `npm audit`, a fresh
migration, and a schema-drift check.

## Done

- Next 16, 0 npm advisories, Dependabot (monthly, grouped).
- Payment loop, mirath, CSV, screening, validation, auth, restore fixes.
- Account: password change, recovery codes (`/forgot`), sign out others,
  delete account; operator reset: `npm run user:reset-password <email>`.
- Per-IP rate limits (`src/lib/rate-limit.ts`), per-account lockout.
- Starter metal prices gate (`unverified` phase); user time zone; Umm al-Qura.
- Metals by weight, foreign-currency holdings, Zakat al-Fitr, giving CSV.
- Hawl restart after a nisab dip (Year page); calendar feed (Settings).
- PWA (service worker, icons, offline page); dark mode; WCAG AA contrast.
- One shared loader: `src/lib/reckoning.ts`. Migrations through 0008.

## Not yet done

1. Build and run the Docker image (`docker compose up`); untested so far.
   The Dockerfile now also copies `scripts/reset-password.cjs`.
2. README and MIZAN-OVERVIEW.md do not yet describe: recovery codes,
   rate limits, dark mode, foreign currency, Umm al-Qura, hawl restart,
   calendar feed, `test:e2e`, `user:reset-password`, Next 16 (`src/proxy.ts`).
3. Left out on purpose (adds upkeep): web push, translations/RTL.

## Conventions

- Commit as the repo owner; no co-author trailers.
- Money is stored to the cent; add with `sumCents`.
- New schema: edit `src/db/schema.ts`, run `npx drizzle-kit generate`.
