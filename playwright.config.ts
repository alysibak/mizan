import { defineConfig, devices } from "@playwright/test";

// End-to-end checks against a production build: `npm run build` first, then
// `npm run test:e2e`. Each run starts from an empty database.
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
  ],
  webServer: {
    command: `node -e "require('fs').rmSync('e2e.db',{force:true})" && node scripts/migrate.cjs && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: "file:e2e.db", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
