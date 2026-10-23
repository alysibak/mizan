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

test("the home page answers from one number, then leads to the guide", async ({ page }) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How much zakat do I owe?");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);
  // Nothing below the question but the footer: no feature lists, no second sign-up pitch.
  await expect(page.getByRole("main").getByRole("heading")).toHaveCount(1);
  await expect(page.getByRole("main").getByRole("link", { name: "Make a free account" })).toHaveCount(0);
  // Thirty seconds: one number, and the answer appears as it is typed.
  await page.getByRole("button", { name: /^Money:/ }).click();
  await page.locator("#quick-currency").selectOption("USD");
  await expect(page.getByText(/Zakat starts at \S*714,/)).toBeVisible();
  await page.fill("#quick-amount", "500");
  await expect(page.getByText(/No zakat to pay/)).toBeVisible();
  await page.fill("#quick-amount", "20000");
  await expect(page.getByText("Your zakat: about US$500")).toBeVisible();
  await page.getByRole("link", { name: "Get the exact answer, step by step" }).click();
  await page.waitForURL("**/guide");
  // The guide starts from that number: it is already under cash.
  await expect(page.getByText("Your US$20,000 from the first page is filled in under cash.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cash in hand" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("#guide-cash")).toHaveValue("20000");
  expect(errors).toEqual([]);
});

test("the old beginner page now opens the guide, in every language", async ({ page }) => {
  await page.goto("/start");
  await expect(page).toHaveURL(/\/guide$/);
  await page.goto("/ur/start");
  await expect(page).toHaveURL(/\/ur\/guide$/);
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
  await expect(result).toContainText("$22,750");
  await expect(result).toContainText("What to do now");
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);

  await page.reload();
  await expect(page.locator("#calc-bank")).toHaveValue("18000");
  await expect(result).toContainText("$568.75");

  await asNewVisitor(page);
  await page.getByRole("link", { name: "Make a free account" }).click();
  await page.waitForURL("**/register?from=calculator");
  await expect(page.getByText("Your figures come with you.")).toBeVisible();
  await page.fill("#name", "Calc Test");
  await page.fill("#email", uniqueEmail("calc"));
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/begin");

  await expect(page.getByText("Amounts in USD")).toBeVisible();
  // Prices arrive from the calculator.
  await page.click("#change-prices");
  await expect(page.locator("#gold")).toHaveValue("100");
  await expect(page.locator("#silver")).toHaveValue("1.2");
  await page.click("button:has-text('I’ll set the day later')");
  await expect(page.getByText("From your calculator")).toBeVisible();
  await page.click("text=Bring these in and finish");
  await page.waitForURL(/\/dashboard/);

  await page.goto("/assets");
  // Rows are buttons that open them for changes.
  await expect(page.getByRole("button", { name: /^Money in the bank.*Edit$/ })).toContainText("18,000");
  await expect(page.getByRole("button", { name: /^Gold you keep as savings.*Edit$/ })).toContainText("3,750");
  await expect(page.getByRole("button", { name: /^Debts due now.*Edit$/ })).toContainText("1,000");
  await page.goto("/zakat");
  await expect(page.getByText("$568.75").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the demo can be explored but not changed", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/login");
  await page.getByRole("button", { name: "Try a demo account" }).click();
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

  await page.getByRole("button", { name: "Make my own account" }).click();
  await page.waitForURL("**/register");
});

test("legal pages, search files, and a branded 404", async ({ page, request }) => {
  for (const [path, heading] of [
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of use"],
    ["/method", "How Mizan works it out"],
    ["/trust", "How Mizan works it out"],
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
  // Signed in, the rest of Mizan is still on Home and in the Menu.
  await expect(
    page.getByRole("region", { name: "Everything else" }).getByRole("link", { name: /Zakat al-Fitr/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).filter({ visible: true }).first().click();
  await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Fasts I missed" })).toBeVisible();
  await page.keyboard.press("Escape");
  const about = page.getByRole("navigation", { name: "About Mizan" });
  await about.getByRole("link", { name: "Privacy" }).click();
  await page.waitForURL("**/privacy");
  // Privacy reads as part of the ledger: the app's own navigation, no public header.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
  await expect(page.getByRole("link", { name: "Home", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await page.goto("/method");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How Mizan works it out");
  await expect(page.getByRole("link", { name: "Home", exact: true }).first()).toBeVisible();

  await page.goto("/calculator");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "My account" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await header.getByRole("link", { name: "My account" }).click();
  await page.waitForURL(/\/dashboard/);

  // Signed out, the same pages are public again and offer sign-in.
  await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
  await page.goto("/privacy");
  await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "My account" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveCount(0);
});

test("the step-by-step guide explains each step and ends with things to do", async ({ page }) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Let’s work out your zakat together");
  // No question about money: it is shown, with "Change" beside it.
  const guide = page.getByRole("region", { name: /What do you have/ });
  await page.click("#guide-change-currency");
  await page.locator("#guide-currency").selectOption("USD");
  await expect(guide.getByText("Amounts in USD")).toBeVisible();
  await expect(guide.getByText("Step 1 of 8")).toBeAttached();

  // Pictures first: only what they have is asked about.
  for (const kind of ["Cash in hand", "Money in the bank", "Gold you keep as savings"]) {
    await page.getByRole("button", { name: kind }).click();
  }
  await expect(page.getByText("Step 1 of 5")).toBeAttached();
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
  await expect(page.getByText(/Worth about \S*750 at today’s price/)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  // Today's prices are known, so silver is used and the nisab question waits in the answer.
  await page.fill("#guide-debts", "1000");
  await page.getByRole("button", { name: "Show my zakat" }).click();

  // 2,000 + 18,000 + 750 − 1,000 = 19,750; 2.5% = 493.75
  await expect(page.getByRole("heading", { name: /Your zakat is \S*493\.75/ })).toBeVisible();
  // The same answer as a picture, described for screen readers.
  await expect(page.getByRole("img", { name: /Everything you counted comes to .*493\.75/ })).toBeVisible();
  // The working is folded away until asked for.
  await expect(page.getByText(/Everything you counted comes to \S*20,750\b/)).toBeHidden();
  await page.getByText("How it was worked out").click();
  await expect(page.getByText(/Everything you counted comes to \S*20,750\b/)).toBeVisible();
  await expect(page.getByText(/leaves \S*19,750\b/)).toBeVisible();
  await expect(page.getByRole("radio", { name: /Silver/ })).toBeChecked();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Remind me next year" }).click();
  expect((await download).suggestedFilename()).toBe("zakat-reminder.ics");
  // Asking to be reminded makes today the zakat day, the same one My zakat keeps.
  await expect(page.getByText(/to your calendar: your zakat day\./)).toBeVisible();
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("mizan-my-v1") ?? "{}"));
  expect(kept.zakatDay).toMatchObject({ month: expect.any(Number), day: expect.any(Number) });

  // Giving in parts, folded for those who give it all at once: what is left,
  // then a word when it is all given.
  await expect(page.locator("#guide-given")).toBeHidden();
  await page.getByText("Giving it in parts?").click();
  await page.fill("#guide-given", "200");
  await expect(page.getByText(/Still to give: \S*293\.75/)).toBeVisible();
  await page.fill("#guide-given", "493.75");
  await expect(page.getByText("All given. May Allah accept it from you.")).toBeVisible();

  // The calculator picks up the same figures.
  await page.goto("/calculator");
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

  // The home page leads here.
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Check who can receive it" }).click();
  await page.waitForURL("**/who-can-receive");
});

test("larger text applies everywhere and survives a reload", async ({ page }) => {
  await page.goto("/guide");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/text-large/);
  // It lives at the end of the Menu.
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: "Larger text" }).click();
  await expect(html).toHaveClass(/text-large/);
  await page.goto("/calculator");
  await expect(html).toHaveClass(/text-large/);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: "Larger text" }).click();
  await expect(html).not.toHaveClass(/text-large/);
  await page.reload();
  await expect(html).not.toHaveClass(/text-large/);
});

test("the Ramadan countdown, and Zakat al-Fitr while it is Ramadan", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00"));
  await page.goto("/");
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
  await expect(code).toHaveAttribute("aria-label", /\/ur\/guide$/);
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
  await page.click("#guide-change-currency");
  await page.locator("#guide-currency").selectOption("PKR");
  await page.getByRole("button", { name: "Gold you keep as savings" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  // Rupees: weights default to tola. 1 tola × 11.6638 g × 36,000 × 0.999 = 419,476.90
  await expect(page.getByText("Weight in tola")).toBeVisible();
  await page.fill("#guide-gold-grams", "1");
  await expect(page.getByText(/Worth about \S*\s?419,476\.90/)).toBeVisible();
  await page.getByRole("button", { name: "Grams", exact: true }).click();
  await expect(page.getByText(/Worth about \S*\s?35,964 at/)).toBeVisible();
});

test("beginner pages are kept for a weak signal; account pages never are", async ({ page }) => {
  await page.goto("/guide");
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
  expect(kept).toEqual(["/guide", "/ur", "/ur/guide"]);
});

test("someone who missed years adds up what they owe and pays it monthly", async ({ page }) => {
  await page.goto("/missed-years");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Missed some years? You can still put it right",
  );
  await page.locator("#tool-currency").selectOption("USD");
  await page.fill("#missed-years", "3");
  await page.fill("#missed-same", "10,000");
  // 3 years × 2.5% × 10,000
  await expect(page.getByText("US$750")).toBeVisible();
  await page.getByRole("radio", { name: "Over 6 months" }).check();
  await expect(page.getByText("US$125 a month for 6 months")).toBeVisible();

  // Below the nisab three years ago: that year is left empty.
  await page.getByRole("button", { name: "It was different each year" }).click();
  await expect(page.getByLabel("Last year")).toHaveValue("10,000");
  await page.getByLabel("3 years ago").fill("");
  await expect(page.getByText("US$500")).toBeVisible();

  await page.getByText("Giving it in parts?").click();
  await page.fill("#missed-given", "200");
  await expect(page.getByText("Still to give: US$300")).toBeVisible();
  // Kept on this device for the next visit, and open since something is noted.
  await page.reload();
  await expect(page.getByText("Still to give: US$300")).toBeVisible();
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
  await page.getByRole("button", { name: "Gold you keep as savings" }).click();
  await page.getByRole("button", { name: "Next" }).click();
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
  await page.click("#guide-change-currency");
  await page.locator("#guide-currency").selectOption("PKR");
  // Past the pictures, asking about everything.
  await page.locator("button.btn-primary").last().click();
  await page.locator("#guide-cash").fill("250000");
  await expect(page.locator("#guide-cash-words")).toHaveText("= 2.5 لاکھ");
});

test("not knowing an amount is fine: a tip, a guess, and the answer says so", async ({ page }) => {
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/guide");
  await page.getByRole("button", { name: "Money in the bank" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  // The bank step: not sure, so a tip, and the amount is kept as a guess.
  await page.getByRole("button", { name: "I’m not sure" }).click();
  await expect(page.getByText("Look at your bank app")).toBeVisible();
  await expect(page.getByText("✓ Marked as a guess")).toBeVisible();
  await page.fill("#guide-bank", "30000");
  const show = page.getByRole("button", { name: "Show my zakat" });
  while (!(await show.isVisible())) await page.getByRole("button", { name: "Next" }).click();
  await show.click();
  await expect(page.getByText("Some amounts are guesses: Money in the bank.")).toBeVisible();
});
