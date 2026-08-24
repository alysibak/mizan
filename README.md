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
  reckon on the Gregorian calendar).
- **Asset tracking.** Categorised holdings (cash, metals, equities, crypto,
  business inventory, receivables, pensions) each with the correct zakatable
  treatment and a short note on the reasoning.
- **Hawl tracking.** The lunar holding year tracked on the Hijri calendar, with a
  due date computed to the day using a self-contained tabular converter.
- **Giving log.** Record zakat and sadaqah. Zakat entries count against what you
  owe.
- **Shariah stock screening.** A business-activity gate plus the AAOIFI financial
  ratios (debt, cash and interest securities, impermissible revenue), with a
  configurable denominator and a dividend purification figure.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) and React 19
- TypeScript throughout
- [Drizzle ORM](https://orm.drizzle.team) on SQLite via
  [libSQL](https://docs.turso.tech/libsql) (`file:` locally, or free [Turso](https://turso.tech) hosted)
- Tailwind CSS 3
- [Zod](https://zod.dev) for validation
- [Vitest](https://vitest.dev) for the engine tests

## Getting started

You need Node 18.18 or newer.

```bash
# 1. Install dependencies
npm install

# 2. Create the database and its tables (defaults to ./mizan.db)
npm run db:push

# 3. (Optional) Seed a demo account so you can see it working
npm run db:seed

# 4. Run it
npm run dev
```

Open http://localhost:3000.

You do not need to create an `.env.local` to start. The database defaults to
`./mizan.db`. If you want to move it, copy `.env.example` to `.env.local`, set
`DATABASE_PATH`, and pass the same value when you run the database scripts.

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
    schema.ts          Drizzle tables (users, sessions, settings, assets,
                       liabilities, giving)
    index.ts           local SQLite client
    seed.ts            demo data
  lib/
    zakat.ts           the calculation engine (pure functions)
    nisab.ts           nisab thresholds and metal-price math
    hijri.ts           Hijri calendar and hawl tracking
    screening.ts       AAOIFI-style stock screening
    categories.ts      asset categories and their zakat treatment
    auth.ts            password hashing and session lifecycle
    session.ts         resolve the current user from the session cookie
    validation.ts      Zod schemas
    money.ts           currency and percent formatting
    zakat.test.ts      Vitest suite for the engine
  app/
    (auth)/            login and register
    (app)/             dashboard, assets, zakat, giving, screening, settings
    api/               route handlers (every mutation is scoped to the owner)
  components/          Nav, Scale (the signature balance), and the client managers
  middleware.ts        route protection
```

## Authorization

Every API route resolves the signed-in user server-side and scopes its query to
that user's rows. Update and delete operations match on both the record id and
the owner id, so one account cannot read or change another account's data even by
guessing ids.

## Testing

```bash
npm test
```

The suite covers nisab calculation, the lunar and solar rates, netting against
liabilities, partial zakatable portions, the below-nisab case, purification, the
Hijri conversion and hawl due date, and all three screening outcomes.

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
# Set DATABASE_URL, DATABASE_AUTH_TOKEN, and APP_SECRET in the Vercel project.
```

### Docker (local / your own machine)

```bash
cp .env.example .env
# edit APP_SECRET in .env
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

The original PocketChange idea was rounding up everyday spending and sending the
difference to charity. That idea is worth reviving, the halal way: round up to
**sadaqah**, logged in the giving table that already exists here. Because the
schema and the giving flow are in place, it is an additive feature rather than a
rebuild. Other natural extensions: an optional free metals-price lookup behind
the manual override, multiple hawl cycles per asset, and an export of your
yearly zakat statement.

## A note on accuracy

The fiqh encoded here reflects mainstream positions, but it is deliberately
explicit about where scholars differ (the gold versus silver standard, long-term
equities, pensions, and the treatment of debt). Treat the numbers as a careful
estimate to help you plan and act, not as a ruling. For anything consequential,
ask someone qualified.
