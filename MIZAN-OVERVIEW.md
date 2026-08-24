# Mizan — top to bottom

**Mizan** (الميزان, “the balance”) is a personal Islamic wealth app. It helps you calculate zakat against nisab, track assets and liabilities, log zakat and sadaqah, monitor the lunar holding year (hawl), and screen stocks for Shariah compliance. It is explicitly an **estimation aid**, not scholarly guidance.

---

## 1. Why it exists

Mizan is the spiritual successor to **PocketChange**, an app that died when a paid third-party API trial expired. Mizan is built on the opposite principle:

> **Nothing in the critical path expires.**

| Dependency | Approach |
|---|---|
| Database | SQLite via libSQL — local file or free Turso hosting |
| Auth | Self-hosted bcrypt + DB-backed sessions |
| Nisab metal prices | You enter them manually |
| Stock screening | You enter figures by hand |

You can clone it, run `npm install`, and it works. The README’s goal is that it still works in five years.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Database | SQLite through Drizzle ORM + `@libsql/client` |
| Styling | Tailwind CSS 3 |
| Validation | Zod |
| Tests | Vitest (pure calculation engine only) |
| Auth | bcryptjs + HTTP-only session cookies |

**Production today:** Vercel (app) + Turso (hosted SQLite)  
**Live URL:** https://mizan-sandy-eight.vercel.app

---

## 3. Architecture at a glance

```
Browser
  → Middleware (cookie check, redirects)
  → App Router pages + API routes
  → getCurrentUser() (DB session lookup)
  → SQLite / Turso
  → Pure lib: zakat, nisab, hijri, screening
```

The app splits cleanly into three layers:

1. **UI** — Server Components + small client components for forms/lists
2. **API** — REST-style route handlers, all scoped to the logged-in user
3. **Pure logic** — `src/lib/zakat.ts`, `nisab.ts`, `hijri.ts`, `screening.ts` — no I/O, fully testable

---

## 4. Project structure

```
src/
  db/
    schema.ts       Tables (users, sessions, settings, assets, liabilities, giving)
    index.ts        libSQL client (lazy init)
    seed.ts         Demo account
  lib/
    zakat.ts        Calculation engine
    nisab.ts        Gold/silver thresholds
    hijri.ts        Lunar calendar + hawl tracking
    screening.ts    AAOIFI-style stock screening
    categories.ts   Asset types and default zakatable portions
    auth.ts         Password hashing, session creation
    session.ts      Resolve current user from cookie
    validation.ts   Zod schemas for API input
    money.ts        Currency/percent formatting
  app/
    page.tsx        Landing page
    (auth)/         Login, register
    (app)/          Dashboard, assets, zakat, giving, screening, settings
    api/            All mutations and reads
  components/       Nav, Scale (balance beam), client managers
  middleware.ts     Lightweight route guard
```

---

## 5. Database schema

Six tables, all tied to a user with cascade deletes:

| Table | Purpose |
|---|---|
| `users` | Email, bcrypt password hash, name |
| `sessions` | Stores **SHA-256 hash** of session token (never the raw token) |
| `settings` | Currency, nisab standard (gold/silver), calendar basis (lunar/solar), metal prices, hawl start date |
| `assets` | Category, label, amount, zakatable portion (0–1) |
| `liabilities` | Label, amount, whether deductible |
| `giving_records` | Zakat or sadaqah, amount, recipient, date |

Key design choices in `schema.ts`:

- **Nisab prices are user-entered** — no paid metals API
- **Hawl start date** is optional until the user sets it
- **Partial zakatable portions** support long-term stocks (~25% default) and pensions

Locally the DB defaults to `./mizan.db`. In production it points at Turso via `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.

---

## 6. Authentication and authorization

### Sign-up / login flow

1. Register → bcrypt hash (cost 12) stored in `users`
2. Login → random 32-byte token in an HTTP-only cookie
3. Only the **SHA-256 hash** of that token is stored in `sessions`
4. Sessions expire after 30 days

### Two layers of protection

**Middleware** (`middleware.ts`) — UX guard only:
- Redirects unauthenticated users away from `/dashboard`, `/assets`, etc.
- Does **not** trust the cookie alone for security

**Server-side** (`getCurrentUser()` in `session.ts`) — authoritative:
- Looks up the token hash in the DB
- Checks expiry
- Every API route calls this and scopes queries with `userId`

Update/delete operations match on **both** record ID and owner ID, so guessing UUIDs cannot access another account’s data.

If a stale cookie exists (session deleted/expired), the app layout redirects to `/api/auth/clear-stale` to wipe it.

---

## 7. The zakat engine (core logic)

Everything important lives in pure functions in `src/lib/zakat.ts`.

### Calculation pipeline

```
Assets × zakatable portion  →  gross zakatable
Minus deductible liabilities →  net zakatable
Compare to nisab             →  is zakat due?
Apply rate                   →  zakat due
```

### Nisab (`nisab.ts`)

Two prophetic standards:

| Standard | Weight | Typical use |
|---|---|---|
| Gold | 85g | Higher threshold |
| Silver | 595g | Lower threshold — many scholars prefer this |

You set gold/silver **price per gram** in settings. Mizan shows both thresholds and lets you pick which one applies.

### Rates

- **Lunar year:** 2.5% (one-fortieth)
- **Solar (Gregorian) year:** 2.5% × (365.25 / 354.367) ≈ **2.577%**

The solar adjustment accounts for the lunar year being ~11 days shorter, so wealth is not under-assessed over time if you reckon on the Gregorian calendar.

### Worked example (from README/tests)

```
Cash + gold + trading stocks  = 18,000
Credit card (deductible)      = -2,000
Net zakatable                 = 16,000

Silver nisab (595g × $1.05/g) =    625  ← lower, commonly chosen
Gold nisab   (85g × $90/g)    =  7,650

16,000 > both → zakat due
Lunar: 16,000 × 2.5%   = $400.00
Solar: 16,000 × 2.577% = $412.43
```

---

## 8. Asset categories

`categories.ts` defines 11 asset types with default zakatable portions and explanatory notes:

| Category | Default portion | Notes |
|---|---|---|
| Cash, bank, gold, silver, crypto, trading stocks, inventory | 100% | Fully zakatable |
| Long-term stocks | 25% | Editable — reflects zakatable underlying assets |
| Receivables | 100% | Editable if recovery is doubtful |
| Pension | 25% | Editable — depends on access/structure |
| Other | 100% | Editable |

The UI surfaces the reasoning so users can adjust to the guidance they follow.

---

## 9. Hawl (holding year)

`hijri.ts` tracks the lunar year requirement: wealth must stay at or above nisab for one full Hijri year before zakat falls due.

- Uses a **tabular Islamic calendar** (arithmetic, not moon-sighting)
- Converts Gregorian ↔ Hijri via Julian Day Numbers
- `hawlDueDate()` = same Hijri date one year later
- Dashboard shows a progress bar, days remaining, and due date

Accurate enough for “days until due”; for the exact payment day, the app notes you should follow local sighting.

---

## 10. Shariah stock screening

`screening.ts` implements an **AAOIFI-style** two-gate check:

**Gate 1 — Business activity**  
Fails if any of: alcohol, gambling, conventional finance, pork/non-halal food, adult entertainment, tobacco, weapons.

**Gate 2 — Financial ratios**

| Ratio | Threshold |
|---|---|
| Interest-bearing debt / denominator | < 30% |
| Cash + interest securities / denominator | < 30% |
| Impermissible revenue / total revenue | < 5% |

Denominator is configurable: **market cap** or **total assets** (index providers differ).

Also computes a **purification ratio** — the fraction of dividends/income to give away separately from zakat (impermissible income is not lawful to keep).

All inputs are manual — no paid financial data API.

---

## 11. Pages and user flow

### Public

- **`/`** — Landing page with value props (2.5%, nisab, hawl)
- **`/login`**, **`/register`** — Auth forms

### Authenticated app (`(app)/` layout)

Sidebar nav on desktop, tab bar on mobile:

| Page | What it does |
|---|---|
| **Dashboard** | Scale visualization, zakat due, paid this year, hawl progress |
| **Assets** | CRUD assets + liabilities |
| **Zakat** | Full breakdown: asset lines, both nisab thresholds, rate, amount due |
| **Giving** | Log zakat and sadaqah; zakat entries reduce “outstanding” on dashboard |
| **Screening** | Interactive stock screener |
| **Settings** | Currency, nisab standard, calendar basis, metal prices, hawl start |

### Signature UI: the Scale

`Scale.tsx` renders a balance beam that tilts based on the ratio of your net zakatable wealth to nisab — the visual metaphor for the whole app.

---

## 12. API layer

REST-style routes under `src/app/api/`:

```
/api/auth/login, register, logout, clear-stale
/api/assets, /api/assets/[id]
/api/liabilities, /api/liabilities/[id]
/api/giving, /api/giving/[id]
/api/settings
/api/health          → { ok: true } if DB reachable
```

Every handler follows the same pattern (see `assets/route.ts`):

1. `getCurrentUser()` → 401 if missing
2. Zod-validate input
3. Query scoped to `user.id`
4. Return JSON

---

## 13. Testing

```bash
npm test   # Vitest
```

Tests cover the pure engine only:

- Nisab calculation (gold vs silver)
- Lunar and solar rates
- Liability netting
- Partial zakatable portions
- Below-nisab case
- Purification math
- Hijri conversion and hawl due date
- All three screening outcomes (pass business, pass ratios, fail)

No end-to-end browser tests — the calculation layer is what must be exact.

---

## 14. Running and deploying

### Local dev

```bash
npm install
npm run db:push      # create tables
npm run db:seed      # optional demo account
npm run dev          # http://localhost:3000
```

Demo: `demo@mizan.app` / `mizan1234`

### Docker

```bash
npm run docker:up    # http://localhost:3080
```

SQLite file on a persistent volume; migrations run on container start.

### Production (current setup)

1. **Turso** — free hosted SQLite (`mizan-prod`)
2. **Vercel** — serverless Next.js
3. Env vars: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `APP_SECRET`
4. `vercel.json` runs `db:migrate` before each build

Fly.io config exists but is **not recommended** — free trial expires and suspends the app.

---

## 15. Design philosophy (summary)

| Principle | How Mizan implements it |
|---|---|
| No expiring dependencies | Local SQLite, manual prices, self-hosted auth |
| Scholarly differences made visible | Gold vs silver nisab, editable portions, notes on each category |
| Separation of concerns | Pure tested engine vs Next.js I/O layer |
| Honest disclaimers | Landing footer, category notes, README |
| Privacy | Per-user data isolation; session tokens hashed at rest |

---

## 16. What could come next (from README)

- **Round-up sadaqah** — PocketChange’s original idea, halal version (schema already supports giving records)
- Optional free metals price lookup (behind manual override)
- Multiple hawl cycles per asset
- Yearly zakat statement export

---

## Quick reference

| | |
|---|---|
| **Live app** | https://mizan-sandy-eight.vercel.app |
| **Demo login** | `demo@mizan.app` / `mizan1234` |
| **Core math** | `src/lib/zakat.ts` |
| **DB schema** | `src/db/schema.ts` |
| **Auth** | `src/lib/auth.ts` + `session.ts` |
| **Deploy** | `vercel --prod` from the `mizan` folder |

That is Mizan end to end: a self-contained Islamic wealth tracker built to outlast paid API trials, with the fiqh encoded transparently and the hard math isolated in tested pure functions.
