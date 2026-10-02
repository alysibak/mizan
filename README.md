# Mizan (الميزان)

**Islamic wealth, in balance.** Calculate your zakat against nisab, keep your
assets accounted for, track your sadaqah, and screen stocks for Shariah
compliance. Mizan runs on your own machine with a local database, so nothing
here can lapse, expire, or be switched off.

> Mizan is a personal estimation aid, not a substitute for scholarly guidance.
> Scholars differ on several of the rulings reflected here. For your specific
> situation, consult a qualified person of knowledge.

---

## Why this exists

This is the spiritual successor to PocketChange. PocketChange did one thing well
and then died, because its core feature was wired to a paid third-party trial.
When the trial ran out, the app was finished.

Mizan is built on the opposite principle: **nothing in the critical path
expires.**

- The database is a local SQLite file. No cloud project to provision, no managed
  instance to keep alive.
- Authentication is self-hosted (bcrypt password hashing plus revocable,
  database-backed sessions). No third-party auth service.
- Nisab depends on gold and silver prices, which you enter yourself. There is no
  paid metals feed in the way of a calculation.
- Stock screening takes figures by hand, so it never depends on a paid financial
  data API either.

You can clone this, run `npm install`, and it works. In five years it will still
work.

## Features

- **Zakat engine.** Pure, tested functions that net your assets against
  deductible liabilities, compare the result to nisab on the gold or silver
  standard, and apply the 2.5 percent rate (with a solar-year adjustment when you
  reckon on the Gregorian calendar). Indicative vs payable when hawl is tracked.
- **Ledger.** Categorised holdings (cash, metals by weight, equities, crypto,
  business inventory, receivables, pensions) with editable zakatable portions
  and school-profile jewellery defaults.
- **Hawl tracking.** One ledger lunar year from your settings date; optional
  per-holding start dates are reminders only. Tabular Hijri calendar.
- **Yearly ritual.** Begin wizard, Reckoning night (forgotten wealth → what-if
  nisab → envelopes → pay), freeze snapshots with a letter to next year, roll
  hawl, printable statement.
- **Giving log.** Zakat, sadaqah, purification, and Zakat al-Fitr; optional
  asnaf tags; round-up helper; CSV export for receipts season. Only zakat
  entries clear outstanding for the cycle, and a payment made after the hawl
  falls due counts toward that cycle only, not the next one after you roll.
- **Metals by weight.** Gold, silver, and jewellery can be entered in grams and
  fineness; they are revalued whenever you save new metal prices.
- **Tools.** Screening (manual AAOIFI-style), mirath sketch, udhiyah shares,
  reverse zakat, forgive debt, envelopes, and more — satellites around the
  sitting, not a second product.
- **Trust.** `/trust` map, estimate banners, optional free metals suggestion
  (manual prices remain source of truth; freshness tracked).
- **Your account.** Change password (signs out other devices), sign out other
  devices, download or restore a full backup, and delete the account with all
  of its data.
- **On your phone.** Installable as a web app (Add to Home Screen on iOS,
  Install on Android). See [On your phone](#on-your-phone).

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) and React 19
- TypeScript throughout
- [Drizzle ORM](https://orm.drizzle.team) on SQLite via
  [libSQL](https://docs.turso.tech/libsql) (`file:` locally, or free [Turso](https://turso.tech) hosted)
- Tailwind CSS 3
- [Zod](https://zod.dev) for validation
- [Vitest](https://vitest.dev) for the engine tests

## Getting started

You need Node 20.9 or newer (22 recommended; see `.nvmrc`).

```bash
# 1. Install dependencies
npm install

# 2. Create the database and its tables (defaults to ./mizan.db)
npm run db:migrate

# 3. (Optional) Seed a demo account so you can see it working
npm run db:seed

# 4. Run it
npm run dev
```

Open http://localhost:3000.

You do not need to create an `.env.local` to start. The database defaults to
`./mizan.db`. To move it, copy `.env.example` to `.env.local`, set
`DATABASE_URL` (for example `file:/path/to/mizan.db`), and pass the same value
when you run the database scripts.

Use `npm run db:migrate` for real databases. `npm run db:push` is a quick way
to prototype schema changes locally; if you used it on a database, `db:migrate`
adopts that database on its next run instead of failing.

### On your phone

Mizan is a progressive web app, so the same code serves desktop and phone.

- **iPhone / iPad:** open your Mizan URL in Safari, tap Share, then
  *Add to Home Screen*.
- **Android:** open it in Chrome and tap *Install* (the dashboard also offers a
  button).

It opens full-screen from the home screen. Pages are never cached on the
device (they hold your finances); if you are offline, Mizan shows an offline
notice instead. Regenerate the app icons after changing `src/app/icon.svg` with
`node scripts/generate-icons.mjs`.

### Demo account

If you ran `npm run db:seed`:

```
email:    demo@mizan.app
password: mizan1234
```

It comes preloaded with a spread of assets, a liability, a hawl in progress, and
a couple of giving records, so the dashboard and the zakat breakdown have
something to show.

## How the zakat math works

A worked example, the same one the test suite asserts:

```
Assets
  Cash                 10,000
  Gold                  3,000
  Stocks (trading)      5,000
  Gross zakatable      18,000

Liabilities
  Credit card          -2,000 (deductible)
  Net zakatable        16,000

Nisab (you set the metal prices: gold 90/g, silver 1.05/g)
  Gold standard    85g  =  7,650
  Silver standard 595g  =    625   <- lower threshold, the common choice

16,000 is above both thresholds, so zakat is due.

  Lunar year:  16,000 x 2.5%     =  400.00
  Solar year:  16,000 x 2.5768%  =  412.43
```

The solar rate is `2.5% x (365.25 / 354.367)`. The lunar year is about eleven
days shorter than the solar year, so if you reckon on the Gregorian calendar the
rate is nudged up to keep the assessment fair over time.

The gap between the gold and silver thresholds (7,650 versus 625) is exactly why
Mizan shows both and lets you choose. The silver standard is lower, so more
people reach it and more reaches those in need.

## Project structure

```
src/
  db/
    schema.ts          users, sessions, settings, assets, liabilities,
                       giving, year_snapshots
    seed.ts            demo account
  lib/
    zakat.ts           calculation engine
    nisab.ts / hijri.ts / screening.ts / madhhab.ts
    giving-window.ts   payable vs indicative, payment window, metal freshness
    reckoning-path.ts  yearly sitting spine
    categories.ts, asnaf.ts, forgotten.ts, unique-calcs.ts, …
  app/
    (auth)/            login, register
    (app)/             dashboard, assets, year, giving, statement, tools, …
    begin/             post-register wizard
    trust/ · method/   honesty pages
    api/               scoped mutations
  components/          Scale, CycleActions, CloseYearPath, managers, tools
  middleware.ts
drizzle/               SQL migrations (0000…)
```

## Security

- Every API route resolves the signed-in user server-side and scopes its query
  to that user's rows. Updates and deletes match on both the record id and the
  owner id, so one account cannot read or change another's data by guessing ids.
- Passwords are bcrypt-hashed (cost 12); sessions are random tokens stored only
  as SHA-256 hashes, in HttpOnly SameSite=Lax cookies.
- Ten wrong passwords lock an account's sign-in for 15 minutes; unknown emails
  take the same time to reject as wrong passwords.
- Writes from another site are refused (`Sec-Fetch-Site`), and pages ship a
  Content-Security-Policy, HSTS, and frame denial.
- All input is validated with Zod: real calendar dates, finite bounded amounts,
  three-letter currency codes. Backup restores are validated and applied in a
  single transaction, so a bad file never leaves you half-restored.

## Testing

```bash
npm test
```

The suite (111 tests) covers the zakat engine, nisab, Hijri conversion (every
day for a century round-trips), hawl and payment windows across a roll, cent
rounding of what is owed, inheritance shares (awl, radd, Umariyyatan,
Mushtaraka), screening, CSV import, metal valuation by weight, input
validation, and backup payload checks.

```bash
npm run lint
npm run typecheck
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, a fresh migration,
a schema-drift check, and a production build on every push and pull request.

## Production

### Free public hosting (PC can be off)

Mizan needs somewhere for the database to live. A free always-on VM with a
local SQLite file does not exist without a payment card. The $0 path is:

1. **Turso** free plan (hosted SQLite, no credit card) — database
2. **Vercel** Hobby (serverless Next.js, no credit card) — app

These are ongoing free tiers with usage caps, not a 7-day trial that suspends
the app. If you blow past the free quotas, the DB can block until you upgrade
or wait for the next month — stay modest and you stay free.

```bash
# After creating a Turso DB and copying URL + token into .env.local:
npm run db:migrate
npx vercel --prod
# Set DATABASE_URL and DATABASE_AUTH_TOKEN (and optionally ADMIN_EMAIL) in the
# Vercel project.
```

### Docker (local / your own machine)

```bash
cp .env.example .env   # optional: ADMIN_EMAIL, PORT
npm run docker:up
# Open http://localhost:3080
```

```bash
npm run docker:logs
npm run docker:down
```

### Fly.io

> Not recommended. New accounts get a short free trial, then the app suspends
> unless you pay — the expiry trap this project was built to avoid.

```bash
fly apps destroy mizan-app --yes
```

### Without Docker

```bash
npm ci
npm run build
npm run db:migrate
NODE_ENV=production npm start
```

Set `DATABASE_URL` to a durable location (`file:...` or a Turso URL).
## Where it could go next

The original PocketChange idea, rounding everyday spending up and giving the
difference, now lives here as round-up **sadaqah**. Natural next steps:
holdings in other currencies with a manual exchange rate, per-asset hawl that
affects payable zakat (today it is a reminder), and reminders on the hawl
anniversary.

## A note on accuracy

The fiqh encoded here reflects mainstream positions, but it is deliberately
explicit about where scholars differ (the gold versus silver standard, long-term
equities, pensions, and the treatment of debt). Treat the numbers as a careful
estimate to help you plan and act, not as a ruling. For anything consequential,
ask someone qualified.
