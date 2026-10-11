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

test("the step-by-step guide explains each step and ends with things to do", async ({ page }) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Let’s work out your zakat together");
  const guide = page.getByRole("region", { name: /Which money do you use/ });
  await page.locator("#guide-currency").selectOption("USD");
  // 595 g × $1.20 and 85 g × $100
  await expect(page.getByText(/Nisab today: \S*714\.00 on silver, or \S*8,500\.00 on gold/)).toBeVisible();
  await expect(guide.getByText("Step 1 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "How much cash do you have?" })).toBeFocused();
  await page.fill("#guide-cash", "2000");
  await page.getByRole("button", { name: "Next" }).click();
  await page.fill("#guide-bank", "18000");
  await page.getByText("What’s the difference?").click();
  await expect(page.getByText(/Interest is different/)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  // Gold by weight, valued at today's price as you type.
  await page.fill("#guide-gold-grams", "10");
  await page.locator("#guide-gold-purity").selectOption("0.75");
  await expect(page.getByText(/Worth about \S*750\.00 at today’s price/)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  for (const step of ["Do you wear gold jewellery?", "Do you keep any silver?", "Do you have any of these?"]) {
    await expect(page.getByRole("heading", { name: step })).toBeVisible();
    await page.getByRole("button", { name: "I don’t have this" }).click();
  }
  await page.fill("#guide-debts", "1000");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Which nisab do you follow?" })).toBeVisible();
  await page.getByRole("button", { name: "Show my zakat" }).click();

  // 2,000 + 18,000 + 750 − 1,000 = 19,750; 2.5% = 493.75
  await expect(page.getByRole("heading", { name: /Your zakat is \S*493\.75/ })).toBeVisible();
  await expect(page.getByText(/Everything you counted comes to \S*20,750\.00/)).toBeVisible();
  await expect(page.getByText(/leaves \S*19,750\.00/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Remind me next year" }).click();
  expect((await download).suggestedFilename()).toBe("zakat-reminder.ics");

  // The calculator picks up the same figures.
  await page.getByRole("link", { name: "Check it in the full calculator" }).click();
  await page.waitForURL("**/calculator");
  await expect(page.locator("#calc-bank")).toHaveValue("18000");
  await expect(page.locator("#result")).toContainText("493.75");
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test("who can receive zakat: each person answered, the reason a tap away", async ({ page }) => {
  await page.goto("/who-can-receive");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Can I give zakat to…?");
  const parents = page.locator("details", { hasText: "My mother or father" });
  await expect(parents.locator("summary")).toContainText("No");
  await expect(parents.getByText(/Looking after your parents/)).toBeHidden();
  await parents.locator("summary").click();
  await expect(parents.getByText(/Looking after your parents/)).toBeVisible();
  await expect(page.locator("details", { hasText: "My husband" }).locator("summary")).toContainText(
    "Scholars differ",
  );
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);

  // The walk-through's answer leads here.
  await page.goto("/start");
  await page.getByRole("link", { name: "Can I give zakat to…?" }).first().click();
  await page.waitForURL("**/who-can-receive");
});

test("larger text applies everywhere and survives a reload", async ({ page }) => {
  await page.goto("/start");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/text-large/);
  await page.getByRole("button", { name: "Larger text" }).filter({ visible: true }).click();
  await expect(html).toHaveClass(/text-large/);
  await page.goto("/calculator");
  await expect(html).toHaveClass(/text-large/);
  await page.getByRole("button", { name: "Larger text" }).filter({ visible: true }).click();
  await expect(html).not.toHaveClass(/text-large/);
  await page.reload();
  await expect(html).not.toHaveClass(/text-large/);
});
