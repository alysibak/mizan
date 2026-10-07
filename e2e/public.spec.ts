import { test, expect } from "@playwright/test";
import {
  PASSWORD,
  asNewVisitor,
  daysAgo,
  expectNoHorizontalScroll,
  expectUniqueIds,
  registerAndSetUp,
  uniqueEmail,
  watchConsole,
} from "./helpers";

// Live price sources are outside the test's control; answer for them.
const PRICES = {
  currency: "USD",
  goldPricePerGram: 100,
  silverPricePerGram: 1.2,
  asOf: "2026-10-05T12:00:00.000Z",
  source: "test prices",
};

test("the landing page leads to the calculator", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Zakat");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);
  await page.getByRole("link", { name: "Calculate your zakat" }).first().click();
  await page.waitForURL("**/calculator");
  expect(errors).toEqual([]);
});

test("the calculator answers without an account, and the answer comes along", async ({
  page,
}) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/calculator");

  await expect(page.locator("#calc-silver-price")).toHaveValue("1.2");
  await page.selectOption("#calc-currency", "USD");
  await expect(page.locator("#calc-gold-price")).toHaveValue("100");

  await page.fill("#calc-cash", "2,000");
  await page.fill("#calc-bank", "18000");
  await page.getByRole("button", { name: "Enter by weight instead" }).first().click();
  await page.fill("#calc-gold-grams", "50");
  await page.selectOption("#calc-gold-purity", "0.75");
  await page.fill("#calc-debts", "1000");
  // 2,000 + 18,000 + 50 g × 0.75 × 100 − 1,000 = 22,750; 2.5% = 568.75
  const result = page.locator("#result");
  await expect(result).toContainText("$568.75");
  await expect(result).toContainText("$22,750.00");
  await expect(result).toContainText("What to do now");
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);

  await page.reload();
  await expect(page.locator("#calc-bank")).toHaveValue("18000");
  await expect(result).toContainText("$568.75");

  await asNewVisitor(page);
  await page.getByRole("link", { name: "Create a free ledger" }).click();
  await page.waitForURL("**/register?from=calculator");
  await expect(page.getByText("Your calculator figures")).toBeVisible();
  await page.fill("#name", "Calc Test");
  await page.fill("#email", uniqueEmail("calc"));
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/begin");

  await page.click("text=I understand — continue");
  await expect(page.locator("#currency")).toHaveValue("USD");
  await page.click("button:has-text('Continue')");
  // Prices arrive from the calculator.
  await expect(page.locator("#gold")).toHaveValue("100");
  await expect(page.locator("#silver")).toHaveValue("1.2");
  await page.click("button:has-text('Continue')");
  await page.click("button:has-text('Set later')");
  await expect(page.getByText("From your calculator")).toBeVisible();
  await page.click("text=Bring these in and finish");
  await page.waitForURL(/\/dashboard/);

  await page.goto("/assets");
  await expect(page.locator("li", { hasText: "Bank balances" })).toContainText("18,000.00");
  await expect(page.locator("li", { hasText: "Gold you keep as savings" })).toContainText(
    "3,750.00",
  );
  await expect(page.locator("li", { hasText: "Debts due now" })).toContainText("1,000.00");
  await page.goto("/zakat");
  await expect(page.getByText("$568.75").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the demo can be explored but not changed", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore a demo ledger" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("You are exploring the demo.")).toBeVisible();

  await page.goto("/assets");
  await page.fill("#asset-new-label", "Should not save");
  await page.fill("#asset-new-amount", "10");
  await page.click("button:has-text('Add asset')");
  await expect(page.getByText("The demo is read-only").first()).toBeVisible();

  const refused = await page.evaluate(async () => {
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "mizan1234", newPassword: "hijacked-123" }),
    });
    return res.status;
  });
  expect(refused).toBe(403);

  await page.getByRole("button", { name: "Start your own ledger" }).click();
  await page.waitForURL("**/register");
});

test("legal pages, search files, and a branded 404", async ({ page, request }) => {
  for (const [path, heading] of [
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of use"],
    ["/method", "The method"],
    ["/trust", "What is verified"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/calculator</loc>");
  const og = await request.get("/opengraph-image");
  expect(og.headers()["content-type"]).toContain("image/png");

  const missing = await page.goto("/no-such-page");
  expect(missing?.status()).toBe(404);
  await expect(page.getByText("Nothing on this page")).toBeVisible();
});

test("oversized request bodies are refused before they are read", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin" },
    data: JSON.stringify({ email: "a@b.co", password: "x".repeat(2 * 1024 * 1024) }),
  });
  expect(res.status()).toBe(413);
});

test("signed in, the about pages open inside the app and public pages offer your ledger", async ({
  page,
}) => {
  await registerAndSetUp(page, {
    email: uniqueEmail("signedin"),
    hawlStart: daysAgo(30),
    amount: "1000",
  });
  // Today's prices can be saved in one step, as the balance page's stale notice does.
  const saved = await page.evaluate(async () => {
    const res = await fetch("/api/settings/metals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goldPricePerGram: 101, silverPricePerGram: 1.3 }),
    });
    const settings = await (await fetch("/api/settings")).json();
    return [res.status, settings.goldPricePerGram, settings.silverPricePerGram];
  });
  expect(saved).toEqual([200, 101, 1.3]);

  // A session from before the hint existed: the next page view restores it.
  await page.context().clearCookies({ name: "mizan_signed_in" });
  await page.goto("/dashboard");
  const about = page.getByRole("navigation", { name: "About Mizan" });
  await about.getByRole("link", { name: "Privacy" }).click();
  await page.waitForURL("**/privacy");
  // Privacy reads as part of the ledger: the app's own navigation, no public header.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
  await expect(page.getByRole("link", { name: "Balance" }).first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await page.goto("/method");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The method");
  await expect(page.getByRole("link", { name: "Balance" }).first()).toBeVisible();

  await page.goto("/calculator");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Your ledger" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await header.getByRole("link", { name: "Your ledger" }).click();
  await page.waitForURL(/\/dashboard/);

  // Signed out, the same pages are public again and offer sign-in.
  await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
  await page.goto("/privacy");
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Your ledger" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Balance" })).toHaveCount(0);
});

test("a beginner is asked three questions and sent on with today’s nisab", async ({ page }) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/");
  await page.getByRole("link", { name: /New to zakat\? Start here/ }).click();
  await page.waitForURL("**/start");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat, in plain words");

  await page.locator("#check-currency").selectOption("USD");
  const check = page.locator("section", { has: page.getByRole("heading", { name: "Do I have to pay zakat?" }) });
  await check.getByRole("button", { name: "Yes", exact: true }).click();
  // 595 g × $1.20 = $714
  await expect(check.getByText(/Are your savings worth more than \S*714\?/)).toBeVisible();
  await check.getByRole("button", { name: "No", exact: true }).last().click();
  await expect(check.getByText("You do not have to pay zakat now")).toBeVisible();

  await check.getByRole("button", { name: "Start again" }).click();
  for (let i = 0; i < 3; i++) await check.getByRole("button", { name: "Yes", exact: true }).nth(i).click();
  await expect(check.getByText("You probably have to pay zakat")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);

  await check.getByRole("link", { name: "Work out my zakat" }).click();
  await page.waitForURL(/\/calculator/);
  await expect(page.locator("#calc-currency")).toHaveValue("USD");
  await expect(page.locator("#calc-silver-price")).toHaveValue("1.2");
  // Everyday holdings first; the rest wait behind one click.
  await expect(page.locator("#calc-cash")).toBeVisible();
  await expect(page.locator("#calc-crypto")).toBeHidden();
  await page.getByText("More kinds of wealth").click();
  await expect(page.locator("#calc-crypto")).toBeVisible();
  expect(errors).toEqual([]);
});
