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

test("the landing page leads to the step-by-step guide", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Zakat");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);
  // One question at a time for someone new; the full calculator is in the header.
  await page.getByRole("link", { name: "Calculate your zakat" }).first().click();
  await page.waitForURL("**/guide");
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
  await page.click("button:has-text('Add it')");
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
  await expect(page.getByRole("link", { name: "Home", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await page.goto("/method");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The method");
  await expect(page.getByRole("link", { name: "Home", exact: true }).first()).toBeVisible();

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
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveCount(0);
});

test("a beginner is asked three questions and sent on with today’s nisab", async ({ page }) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/");
  await page.getByRole("link", { name: /New to zakat\? Start here/ }).click();
  await page.waitForURL("**/start");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat, in plain words");
  // Pictures do the explaining: one coin in forty, what counts, the year of moons.
  await expect(page.getByRole("img", { name: /200,000 ÷ 40 = 5,000/ })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "The home you live in" })).toBeVisible();
  await expect(page.getByRole("img", { name: /about 354 days/ })).toBeVisible();

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
  // The same answer as a picture, described for screen readers.
  await expect(page.getByRole("img", { name: /Everything you counted comes to .*493\.75/ })).toBeVisible();
  await expect(page.getByText(/leaves \S*19,750\.00/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Remind me next year" }).click();
  expect((await download).suggestedFilename()).toBe("zakat-reminder.ics");
  // Asking to be reminded makes today the zakat day, the same one My zakat keeps.
  await expect(page.getByText(/to your calendar: your zakat day\./)).toBeVisible();
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("mizan-my-v1") ?? "{}"));
  expect(kept.zakatDay).toMatchObject({ month: expect.any(Number), day: expect.any(Number) });

  // Giving in parts: what is left, then a word when it is all given.
  await page.fill("#guide-given", "200");
  await expect(page.getByText(/Still to give: \S*293\.75/)).toBeVisible();
  await page.fill("#guide-given", "493.75");
  await expect(page.getByText("All given. May Allah accept it from you.")).toBeVisible();

  // The calculator picks up the same figures.
  await page.getByRole("link", { name: "Check it in the full calculator" }).click();
  await page.waitForURL("**/calculator");
  await expect(page.locator("#calc-bank")).toHaveValue("18000");
  await expect(page.locator("#result")).toContainText("493.75");
  await expect(page.locator("#calc-given")).toHaveValue("493.75");
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test("who can receive zakat: each person answered, the reason a tap away", async ({ page }) => {
  await page.goto("/who-can-receive");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Can I give zakat to…?");
  const parents = page.locator("details", { hasText: "My mother or father" });
  await expect(parents.locator(":scope > summary")).toContainText("No");
  await expect(parents.getByText(/Looking after your parents/)).toBeHidden();
  await parents.locator(":scope > summary").click();
  await expect(parents.getByText(/Looking after your parents/)).toBeVisible();
  await expect(page.locator("details", { hasText: "My husband" }).locator(":scope > summary")).toContainText(
    "Scholars differ",
  );
  // Each answer carries its evidence, strongest first, with the views where scholars differ.
  const husband = page.locator("#husband");
  await husband.locator("summary").first().click();
  const evidence = husband.locator("details details");
  await expect(evidence.locator("summary")).toContainText("Strong");
  await evidence.locator("summary").click();
  await expect(evidence.getByText("Where scholars differ")).toBeVisible();
  await expect(evidence.getByText(/Sahih al-Bukhari and Sahih Muslim, from Zaynab/)).toBeVisible();
  // The eight groups of 9:60 as picture cards.
  await expect(page.getByRole("list", { name: /names eight groups/ }).getByRole("listitem")).toHaveCount(8);
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

test("the Ramadan countdown, and Zakat al-Fitr while it is Ramadan", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00"));
  await page.goto("/start");
  await expect(page.getByText(/Ramadan 1448 begins around .*2027/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Remind me a week before Ramadan" }).click();
  expect((await download).suggestedFilename()).toBe("ramadan-reminder.ics");

  await page.clock.setFixedTime(new Date("2027-02-15T10:00:00"));
  await page.goto("/");
  await expect(page.getByText(/It is Ramadan, day \d+/)).toBeVisible();
  await page.getByRole("link", { name: "Work out Zakat al-Fitr" }).click();
  await page.waitForURL("**/zakat-al-fitr");
});

test("do I pay zakat on…: each thing answered, with the sources a tap away", async ({ page }) => {
  await page.goto("/what-counts");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Do I pay zakat on…?");
  const home = page.locator("details", { hasText: "The home you live in" });
  await expect(home.locator(":scope > summary")).toContainText("No");
  await expect(page.locator("details", { hasText: "Your salary" }).locator(":scope > summary")).toContainText(
    "Only what you still have",
  );
  await home.locator(":scope > summary").click();
  await expect(home.getByText(/however much it is worth/)).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.getByRole("link", { name: "Where this comes from" }).first().click();
  await page.waitForURL("**/sources");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where this comes from");
  await expect(page.getByText(/Quran 9:60/)).toBeVisible();
  await expect(page.locator("main ol > li")).toHaveCount(12);
});

test("a poster for the mosque, with a code that opens the beginner's page", async ({ page }) => {
  await page.goto("/ur/poster");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const poster = page.getByRole("article", { name: "کیا آپ پر زکوٰۃ فرض ہے؟" });
  await expect(poster).toBeVisible();
  const code = poster.locator("[role=img][aria-label]");
  await expect(code).toHaveAttribute("aria-label", /\/ur\/start$/);
  await expect(code.locator("svg")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("prices per tola where gold is weighed in tola", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { ...PRICES, currency: "PKR", goldPricePerGram: 36000, silverPricePerGram: 400 } }),
  );
  await page.goto("/calculator");
  await page.selectOption("#calc-currency", "PKR");
  // 36,000 × 11.6638 = 419,896.80
  await expect(page.getByText(/Gold \S*\s?419,896\.80 a tola/)).toBeVisible();
  await page.selectOption("#calc-currency", "GBP");
  await expect(page.getByText(/a tola/)).toHaveCount(0);
});

test("gold can be weighed in tola, the unit people in Pakistan know it by", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { ...PRICES, currency: "PKR", goldPricePerGram: 36000, silverPricePerGram: 400 } }),
  );
  await page.goto("/guide");
  await page.locator("#guide-currency").selectOption("PKR");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "I don’t have this" }).click();
  await page.getByRole("button", { name: "I don’t have this" }).click();
  // Rupees: weights default to tola. 1 tola × 11.6638 g × 36,000 × 0.999 = 419,476.90
  await expect(page.getByText("Weight in tola")).toBeVisible();
  await page.fill("#guide-gold-grams", "1");
  await expect(page.getByText(/Worth about \S*\s?419,476\.90/)).toBeVisible();
  await page.getByRole("button", { name: "Grams", exact: true }).click();
  await expect(page.getByText(/Worth about \S*\s?35,964\.00/)).toBeVisible();
});

test("beginner pages are kept for a weak signal; account pages never are", async ({ page }) => {
  await page.goto("/start");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.goto("/ur/guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("آئیے مل کر آپ کی زکوٰۃ نکالیں");
  // The home page too, which is where the home-screen app opens.
  await page.goto("/ur");
  // Signed out, /settings redirects to /login: neither may be stored.
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login/);

  // The service worker's own fetches ignore the browser's offline switch, so
  // look in its page store directly.
  const kept = await page.evaluate(async () => {
    const cache = await caches.open("mizan-v1-pages");
    return (await cache.keys()).map((request) => new URL(request.url).pathname).sort();
  });
  expect(kept).toEqual(["/start", "/ur", "/ur/guide"]);
});

test("someone who missed years adds up what they owe and pays it monthly", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("link", { name: "Add up what you missed" }).click();
  await page.waitForURL("**/missed-years");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Missed some years? You can still put it right",
  );
  await page.locator("#tool-currency").selectOption("USD");
  await page.fill("#missed-years", "3");
  await page.fill("#missed-same", "10,000");
  // 3 years × 2.5% × 10,000
  await expect(page.getByText("US$750.00")).toBeVisible();
  await page.getByRole("radio", { name: "Over 6 months" }).check();
  await expect(page.getByText("US$125.00 a month for 6 months")).toBeVisible();

  // Below the nisab three years ago: that year is left empty.
  await page.getByRole("button", { name: "It was different each year" }).click();
  await expect(page.getByLabel("Last year")).toHaveValue("10,000");
  await page.getByLabel("3 years ago").fill("");
  await expect(page.getByText("US$500.00")).toBeVisible();

  await page.fill("#missed-given", "200");
  await expect(page.getByText("Still to give: US$300.00")).toBeVisible();
  // Kept on this device for the next visit.
  await page.reload();
  await expect(page.getByText("Still to give: US$300.00")).toBeVisible();
});

test("a beginner types a word and finds every answer that mentions it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Ask a question" }).click();
  await page.waitForURL("**/ask");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ask a question about zakat");
  // Before typing, every question is listed.
  await expect(page.getByRole("heading", { name: "All questions" })).toBeVisible();

  await page.getByRole("main").getByLabel("What do you want to know?").fill("salary");
  await expect(page.getByRole("heading", { name: "Answers" })).toBeVisible();
  const first = page.getByRole("main").locator("details").first();
  await expect(first.locator(":scope > summary")).toContainText("Your salary");
  await first.locator(":scope > summary").click();
  await first.getByRole("link", { name: "Do I pay zakat on…?" }).click();
  // The link lands on that very answer, already open.
  await page.waitForURL("**/what-counts#salary");
  await expect(page.locator("#salary > details")).toHaveAttribute("open", "");

  await page.goto("/ask");
  await page.getByRole("main").getByLabel("What do you want to know?").fill("helicopter");
  await expect(page.getByRole("status")).toHaveText(/No answer mentions that yet/);

  // Pages in English only are found too: farm animals, bank interest.
  await page.getByRole("main").getByLabel("What do you want to know?").fill("camels");
  const farm = page.getByRole("main").locator("details").first();
  await expect(farm.locator(":scope > summary")).toContainText("My goats, sheep, cows, buffalo, or camels");
  await farm.locator(":scope > summary").click();
  await expect(farm.getByRole("link", { name: "Crops and animals" })).toHaveAttribute("href", "/farm");
  await page.getByRole("main").getByLabel("What do you want to know?").fill("interest");
  await expect(page.getByRole("main").getByText("Interest my bank paid me")).toBeVisible();
});

test("the answer search understands Urdu as people type it", async ({ page }) => {
  await page.goto("/ur/ask");
  await page.locator("#ask-q").fill("سونا");
  await expect(page.getByRole("main").locator("details").first().locator(":scope > summary")).toContainText("سون");
});


test("one answer can be shared, and its link opens straight to it", async ({ page }) => {
  await page.goto("/who-can-receive#parents");
  const answer = page.locator("#parents");
  await expect(answer.locator(":scope > details")).toHaveAttribute("open", "");
  await expect(answer.getByText(/Looking after your parents/)).toBeInViewport();
  const share = answer.getByRole("group", { name: "Share this answer" });
  if (await share.count()) {
    const href = await share.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
    const text = decodeURIComponent(href!.split("text=")[1]);
    expect(text).toMatch(/^My mother or father: No\./);
    expect(text).toMatch(/\/who-can-receive#parents$/);
  } else {
    await expect(answer.getByRole("button", { name: "Share this answer" })).toBeVisible();
  }
});

test("a worksheet to print and fill in by hand, in the reader's language", async ({ page }) => {
  await page.goto("/ur/worksheet");
  const sheet = page.getByRole("article", { name: "میری زکوٰۃ کا حساب" });
  await expect(sheet).toContainText("ج ÷ 40");
  await expect(sheet.locator("[role=img][aria-label]")).toHaveAttribute("aria-label", /\/ur\/nisab$/);
  await expect(page.getByRole("button", { name: "صفحہ پرنٹ کریں" })).toBeVisible();
});

test("someone who does not know their gold's weight picks pieces instead", async ({ page }) => {
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/guide");
  await page.locator("#guide-currency").selectOption("USD");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Do you keep any gold?" })).toBeVisible();
  await page.getByRole("button", { name: "I don’t know the weight" }).click();
  await page.getByRole("button", { name: "Add one: Bangle" }).click();
  await page.getByRole("button", { name: "Add one: Bangle" }).click();
  await page.getByRole("button", { name: "Add one: Ring" }).click();
  // 2 × 12 g + 4 g, a rough guess.
  await expect(page.getByText("About 28 g: a rough guess from typical weights.")).toBeVisible();
  await page.getByRole("button", { name: "Use this weight" }).click();
  await expect(page.locator("#guide-gold-grams")).toHaveValue("28");
});

test("a large amount is also said in words, so a slipped zero shows", async ({ page }) => {
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/calculator");
  await page.locator("#calc-currency").selectOption("PKR");
  await page.locator("#calc-cash").fill("2500000");
  await expect(page.locator("#calc-cash-words")).toHaveText("= 25 lakh");
  await page.locator("#calc-cash").fill("25000000");
  await expect(page.locator("#calc-cash-words")).toHaveText("= 2.5 crore");
  await page.locator("#calc-cash").fill("500");
  await expect(page.locator("#calc-cash-words")).toHaveCount(0);

  // In Urdu, in the words people say.
  await page.goto("/ur/guide");
  await page.locator("#guide-currency").selectOption("PKR");
  await page.locator("button.btn-primary").last().click();
  await page.locator("#guide-cash").fill("250000");
  await expect(page.locator("#guide-cash-words")).toHaveText("= 2.5 لاکھ");
});
