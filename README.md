# Mizan (الميزان)

**Islamic wealth, in balance.** A free, private zakat calculator and ledger.
Weigh what you hold against nisab with live metal prices, keep your hawl on the
Hijri calendar, record zakat and sadaqah, and close each year with a clear
statement.

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

- The database is SQLite (a local file, or free hosted [Turso](https://turso.tech)).
  No managed instance to keep alive.
- Authentication is self-hosted (bcrypt password hashing plus revocable,
  database-backed sessions). No third-party auth service.
- Nisab depends on gold and silver prices. A free, keyless source can suggest
  today's prices, but the figure you confirm is the source of truth, and
  everything works with no outside service at all.
- Stock screening takes figures by hand, so it never depends on a paid
  financial data API either.

You can clone this, run `npm install`, and it works. In five years it will still
work.

## Features

**For everyone, no account**

- **Zakat calculator** (`/calculator`). Live gold and silver prices in 59
  currencies (picked from the visitor's region), gold or silver nisab, worn
  jewellery by school, metal by weight and karat, long-term shares and pensions
  at a share you set, and debts due now. It runs in the browser; figures stay
  in that browser's storage and come along into a new account at setup.
- **Seven languages.** The landing page, the calculator, its FAQ, and the nisab
  pages read in English, Arabic, Urdu, Indonesian, Malay, Turkish, and French
  (`/ar`, `/ur`, `/id`, `/ms`, `/tr`, `/fr`). Arabic and Urdu are right to left
  with an Arabic-script face, and amounts typed in Arabic-Indic digits work.
  Every page links its translations for search engines.
- **Nisab today** (`/nisab`, `/nisab/{currency}`). Today's silver and gold
  thresholds in every currency, refreshed hourly, each with a link that opens
  the calculator in that currency.
- **Free tools.** An Islamic inheritance calculator (`/inheritance`, exact
  Quranic shares with awl, radd, and blocking explained), Zakat al-Fitr for a
  household (`/zakat-al-fitr`), a halal stock screen with dividend purification
  (`/halal-stocks`), and qurbani shares (`/qurbani`). Each page explains the
  rulings it rests on and where the schools differ.
- **Guides** (`/guides`). Zakat on gold and silver, savings, shares and funds,
  cryptocurrency, pensions, and property: what counts, how to value it, and
  where the schools differ, each ending in the calculator.
- **Read-only demo** (optional). One click on the sign-in page opens a sample
  ledger nobody can change.

**With a free account**

- **Zakat engine.** Pure, tested functions that net your assets against
  deductible liabilities, compare the result to nisab on the gold or silver
  standard, and apply 2.5% (with a solar-year adjustment if you reckon on the
  Gregorian calendar). Indicative versus payable once the hawl is tracked.
- **Ledger.** Cash, bank, gold and silver (by value or by weight), jewellery,
  shares held to trade or for the long term, crypto, business stock, money owed
  to you, pensions, and holdings kept in other currencies at your own rate.
  School-profile defaults for disputed items. CSV import.
- **Hawl on the Hijri calendar.** Tabular or Umm al-Qura. Restart after a dip
  below nisab, and a private calendar feed so your own calendar app reminds you
  of the reckoning day.
- **The yearly sitting.** Setup wizard, reckoning night (forgotten wealth,
  what-if nisab, envelopes, pay), frozen snapshots with a letter to next year,
  rolling the hawl, and a printable statement.
- **Giving log.** Zakat, sadaqah, purification, and Zakat al-Fitr, with
  optional asnaf tags and a round-up helper. Only zakat clears what is owed for
  the cycle, and a payment after the hawl falls due counts toward that cycle
  only. CSV export for receipts season.
- **Tools.** Screening (manual, AAOIFI-style), mirath sketch, udhiyah shares,
  reverse zakat, forgiving a debt, and more.
- **Your account.** Change password (signs out other devices), one-time
  recovery codes, two-step sign-in with any authenticator app, sign out
  everywhere, download or restore a full backup, and delete the account with
  everything in it.
- **Email, if the server sends it** (optional, off by default). Confirm your
  address, reset a forgotten password by link, and opt in to a reminder a week
  before your hawl day and on the day. Emails carry a date and a link, never
  amounts.
- **On your phone.** An installable web app with dark mode and an offline
  notice. The main pages are audited against WCAG 2.1 AA in light and dark on
  every change.

**Honesty pages:** `/method` (how the numbers are made), `/trust` (what is
verified and what is not), `/privacy`, and `/terms`.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) and React 19, TypeScript
- [Drizzle ORM](https://orm.drizzle.team) on SQLite via
  [libSQL](https://docs.turso.tech/libsql) (`file:` locally, or Turso hosted)
- Tailwind CSS 3, [Zod](https://zod.dev) for validation
- [Vitest](https://vitest.dev) for unit tests, [Playwright](https://playwright.dev)
  and [axe](https://github.com/dequelabs/axe-core) for end-to-end and
  accessibility tests

## Getting started

You need Node 20.9 or newer (22 recommended; see `.nvmrc`).

```bash
npm install
npm run db:migrate     # create the database (defaults to ./mizan.db)
npm run db:seed        # optional: the demo account
npm run dev            # http://localhost:3000
```

No `.env.local` is needed to start. To change a setting, copy `.env.example` to
`.env.local`; every setting is described under [Configuration](#configuration).

Use `npm run db:migrate` for real databases. `npm run db:push` is a quick way to
prototype schema changes locally; if you used it on a database, `db:migrate`
adopts that database on its next run instead of failing. New schema: edit
`src/db/schema.ts`, then `npx drizzle-kit generate`.

### The demo account

`npm run db:seed` creates (or resets) a demo ledger with a year of holdings and
giving:

```
email:    demo@mizan.app
password: mizan1234
```

On a public server, set `DEMO_EMAIL=demo@mizan.app` too. The account then
refuses every change (so one visitor cannot lock, empty, or delete it for the
next), and the sign-in page offers **Explore a demo ledger**, which signs
visitors in with one click for a day. Re-run the seed now and then to refresh
its dates.

### On your phone

- **iPhone / iPad:** open your Mizan URL in Safari, tap Share, then *Add to Home
  Screen*.
- **Android:** open it in Chrome and tap *Install* (the dashboard also offers a
  button).

Pages are never cached on the device (they hold your finances); offline, Mizan
shows a notice instead. Regenerate the icons after changing `src/app/icon.svg`
with `node scripts/generate-icons.mjs`.

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
  Solar year:  16,000 x 2.5768%  =  412.28
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
  proxy.ts             redirects, cross-site write refusal, body-size limit
  instrumentation.ts   one structured log line per server error
  db/                  schema, client, demo seed
  i18n/                languages: config, and one typed message file each
  lib/
    zakat.ts           calculation engine (pure)
    nisab.ts · hijri.ts · giving-window.ts · madhhab.ts · screening.ts
    calculator.ts      the public calculator's model (pure)
    price-sources.ts   parsing and sanity checks for free price feeds (pure)
    reckoning.ts       one loader for every reckoning screen
    api.ts             route guards: signed in, writable, password re-check,
                       row limits, capped body reads
    auth.ts · session.ts · rate-limit.ts · validation.ts · site.ts
    totp.ts            authenticator codes (RFC 6238, pure)
    email.ts · email-content.ts · one-time-tokens.ts
  app/
    page.tsx           landing (static)
    calculator/        public calculator (static)
    [locale]/          the translated landing, calculator, and nisab pages
    nisab/             nisab today, per currency (hourly)
    inheritance/ zakat-al-fitr/ halal-stocks/ qurbani/   free tools
    guides/            zakat on gold, savings, shares, crypto, pensions, property
    privacy/ terms/ method/ trust/
    (auth)/            sign in, register, forgot
    reset/             new password from an emailed link
    (setup)/begin/     setup wizard
    (app)/             balance, ledger, year, give, statement, tools, settings
    api/               JSON routes, each scoped to the signed-in user
  components/
  content/guides.tsx   the guides' text, kept in step with the calculator
drizzle/               SQL migrations (0000…0012)
e2e/                   Playwright: yearly cycle, public pages, languages,
                       tools, email, two-step sign-in, accessibility
```

## Configuration

All optional. Locally, put them in `.env.local`; on Vercel, in the project's
environment variables; with Docker, in `.env` next to `docker-compose.yml`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:mizan.db` (default) or `libsql://…` for Turso |
| `DATABASE_AUTH_TOKEN` | Turso token (ignored for `file:` URLs) |
| `APP_URL` | Public address, e.g. `https://mizan.example`. Used for canonical links, social cards, the sitemap, and calendar-feed links. Needed at **build** time for the static pages; Vercel falls back to its production domain. |
| `OPERATOR_NAME`, `CONTACT_EMAIL` | Who runs this copy, shown in the privacy policy and terms. Set both before going public. |
| `ADMIN_EMAIL` | Comma-separated emails that can open `/admin/users` (sign-up counts; never ledger contents). |
| `DEMO_EMAIL` | Makes that account the read-only, one-click demo. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Turns on cookieless [Plausible](https://plausible.io) analytics for public pages only, with `Signup`, `Demo`, and `Calculated` events. Build time. |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | Script URL for a self-hosted Plausible (defaults to plausible.io, manual mode). |
| `EMAIL_FROM` | Sender for optional email, e.g. `Mizan <hello@mizan.example>`. Email is on only when this, `APP_URL`, and a sender below are set. |
| `RESEND_API_KEY` | Sends through [Resend](https://resend.com)'s HTTP API. |
| `EMAIL_OUTBOX_FILE` | Development: append each message to this file as JSON instead of sending it. |
| `CRON_SECRET` | Protects the daily reminder run, `GET /api/cron/reminders`. Vercel Cron sends it (see `vercel.json`); elsewhere, call it once a day with `Authorization: Bearer <secret>`. |
| `PORT` | Host port for Docker Compose (default 3080). |

## Security

- Every API route resolves the signed-in user on the server and scopes its query
  to that user's rows; updates and deletes match on both the record id and the
  owner id. Every write passes one guard that also refuses the read-only demo.
- Passwords are bcrypt-hashed (cost 12); sessions are random tokens stored only
  as SHA-256 hashes, in HttpOnly SameSite=Lax cookies.
- Ten wrong passwords lock an account for 15 minutes. Re-entering the password
  to change it, make a recovery code, or delete the account counts toward the
  same lock, so a stolen session cannot be used to guess it. Unknown emails take
  as long to reject as wrong passwords. Sign-up, sign-in, recovery, and the demo
  have per-network limits.
- Writes from another site are refused (`Sec-Fetch-Site`); request bodies are
  size-capped before they are read; each account has row limits. Pages ship a
  Content-Security-Policy, HSTS, and frame denial.
- Two-step sign-in (TOTP): after a right password the browser gets a
  five-minute ticket, not a session. Wrong codes share the password lockout,
  and a right password alone does not reset it. Each code's time step is
  claimed once, atomically, so codes cannot be replayed. A recovery code turns
  two-step off (for a lost phone); an emailed reset never skips it.
- Optional email: links are built from `APP_URL`, never the request's Host
  header. Reset links go only to confirmed addresses, last 30 minutes, work
  once, and are revoked by any password change. A reset request looks the same
  whether or not the address has an account: the lookup and send run after the
  response.
- All input is validated with Zod. Backup restores are validated and applied in
  one transaction, so a bad file never leaves you half-restored.
- Server errors are logged as one JSON line with the error digest the user sees,
  never with request bodies.

**Self-hosting behind a proxy.** Per-network limits read the client address
from `X-Forwarded-For`. Vercel sets it. If you expose the Node server yourself,
put it behind a reverse proxy that **overwrites** that header with the real
client address, or a client can claim any address and spread its attempts (the
per-account lock still holds). With Caddy:

```
mizan.example {
  reverse_proxy localhost:3080 {
    header_up X-Forwarded-For {remote_host}
  }
}
```

## Testing

```bash
npm run lint && npm run typecheck && npm test   # 249 unit tests
npm run build && npm run test:e2e               # Playwright, needs Chromium
```

Unit tests cover the zakat engine, nisab, Hijri conversion (every day for a
century round-trips), hawl and payment windows across a roll, cent rounding,
inheritance shares (awl, radd, Umariyyatan, Mushtaraka), screening, CSV import,
metal by weight, the calculator (including amounts typed with a decimal comma
or Arabic-Indic digits), price-feed parsing, input validation, every language's
messages against English (placeholders, no gaps), authenticator codes against
the RFC 4226 and 6238 vectors, and reminder timing.

End-to-end tests run the production build on a phone and a desktop: a full
zakat year, the calculator carried into a new account, the read-only demo,
legal and search files, Arabic right to left with Arabic-Indic input, every
language and hreflang, the nisab pages into the calculator, the four free
tools and guides, email confirmation, reminders and reset links (through a file outbox),
two-step sign-in end to end, and an axe audit of 38 pages against WCAG 2.1 AA
in light and dark.

CI (`.github/workflows/ci.yml`) runs all of that on every push to `master` and
every pull request, plus a runtime dependency audit, a fresh migration, a
schema-drift check, and a Docker build that must boot and answer its health
check.

A second workflow (`.github/workflows/monitor.yml`) checks the live site every
two hours: the health check, live gold and silver prices in USD, PKR and EUR,
and that `/nisab/pkr` shows figures. GitHub emails the repository owner when a
run fails. Set the repository variable `PRODUCTION_URL` to your domain.

## Production

### Free public hosting (Vercel + Turso)

Mizan needs somewhere for the database to live. The $0 path is
[Turso](https://turso.tech)'s free plan (hosted SQLite) for the database and
Vercel's Hobby plan for the app. Both are ongoing free tiers with usage caps,
not trials that suspend the app.

```bash
# With a Turso database URL and token in .env.local:
npm run db:migrate
npx vercel --prod
```

In the Vercel project, set `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `APP_URL`,
`OPERATOR_NAME`, and `CONTACT_EMAIL` (and optionally `ADMIN_EMAIL`,
`DEMO_EMAIL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`). `vercel.json` runs migrations
before each build. To seed the demo there, run the seed locally against the
same database:

```bash
DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… DEMO_EMAIL=demo@mizan.app npm run db:seed
```

Back the database up regularly (for example `turso db shell <db> .dump > backup.sql`)
and point an uptime monitor at `/api/health`.

### Docker (your own machine or server)

```bash
cp .env.example .env   # set APP_URL, OPERATOR_NAME, CONTACT_EMAIL, …
npm run docker:up      # builds with your APP_URL, then serves http://localhost:3080
```

```bash
npm run docker:logs
npm run docker:down
```

The SQLite file lives on the `mizan-data` volume; migrations run on every start.
Put a reverse proxy in front for HTTPS (see the Caddy example above).

### Without Docker

```bash
npm ci
npm run build
npm run db:migrate
npm start              # serves the standalone build on $PORT (default 3000)
```

Set `DATABASE_URL` to a durable location (`file:/path/mizan.db` or a Turso URL).

### Fly.io

> Not recommended. New accounts get a short free trial, then the app suspends
> unless you pay — the expiry trap this project was built to avoid.

## A note on accuracy

The fiqh encoded here reflects mainstream positions, but it is deliberately
explicit about where scholars differ (the gold versus silver standard, worn
jewellery, long-term equities, pensions, and the treatment of debt). Treat the
numbers as a careful estimate to help you plan and act, not as a ruling. For
anything consequential, ask someone qualified.

## License

Mizan is free software under the [GNU Affero General Public License v3.0](LICENSE)
(`AGPL-3.0-only`). You may use, study, change, and self-host it. If you run a
modified version for other people over a network, you must offer them its
source code under the same license.
