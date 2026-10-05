import { defineConfig, devices } from "@playwright/test";
import { CRON_SECRET, OUTBOX } from "./e2e/helpers";

// End-to-end checks against a production build: `npm run build` first, then
// `npm run test:e2e`. Each run starts from an empty database with the
// read-only demo account seeded.
const PORT = 3210;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    {
      name: "desktop",
      testMatch: /(public|languages|tools)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } },
    },
  ],
  webServer: {
    command: [
      `node -e "for (const f of ['e2e.db','e2e-outbox.jsonl']) require('fs').rmSync(f,{force:true})"`,
      "node scripts/migrate.cjs",
      "npx tsx src/db/seed.ts",
      `node scripts/start.cjs -p ${PORT}`,
    ].join(" && "),
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:e2e.db",
      DEMO_EMAIL: "demo@mizan.app",
      APP_URL: `http://localhost:${PORT}`,
      EMAIL_FROM: "Mizan <hello@mizan.test>",
      EMAIL_OUTBOX_FILE: OUTBOX,
      CRON_SECRET,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
