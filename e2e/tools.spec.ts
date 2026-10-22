import { test, expect } from "@playwright/test";

// The free tools work without an account, in the visitor's chosen currency,
// and point to a free ledger rather than to pages behind sign-in.

test("the currency chosen in one tool carries to the next", async ({ page }) => {
  await page.goto("/missed-years");
  await page.locator("#tool-currency").selectOption("GBP");
  await page.goto("/zakat-al-fitr");
  await expect(page.locator("#tool-currency")).toHaveValue("GBP");
});

test("zakat al-Fitr: per head, with a ledger nudge instead of a signed-in link", async ({ page }) => {
  await page.goto("/zakat-al-fitr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat al-Fitr calculator");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#people").fill("4");
  await page.locator("#perPerson").fill("15");
  await expect(page.getByText("US$60.00")).toBeVisible();
  await expect(page.getByRole("link", { name: "Record on Give" })).toHaveCount(0);
  await page.getByRole("link", { name: "Open a free ledger" }).click();
  await page.waitForURL("**/register");
});

test("every tool page is in the Menu and has no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  for (const [name, path] of [
    ["Ramadan: the last ten nights", "/ramadan"],
    ["Fasts I missed", "/fasts"],
    ["Where to give, and which charity", "/give"],
    ["My bank paid me interest", "/interest"],
    ["Charity without money", "/sadaqah"],
    ["Zakat in ten questions", "/quiz"],
    ["Zakat for my family", "/family"],
    ["Zakat on my shop", "/shop"],
    ["Crops and animals", "/farm"],
    ["Zakat al-Fitr for my family", "/zakat-al-fitr"],
  ]) {
    await expect(menu.getByRole("link", { name, exact: true })).toHaveAttribute("href", path);
  }
  for (const path of ["/ramadan", "/fasts", "/give", "/interest", "/sadaqah", "/quiz", "/family", "/shop", "/farm", "/zakat-al-fitr"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("removed pages send old links somewhere useful", async ({ page }) => {
  for (const [from, to] of [
    ["/inheritance", "/ask"],
    ["/halal-stocks", "/what-counts"],
    ["/qurbani", "/ask"],
    ["/trust", "/method"],
  ]) {
    await page.goto(from);
    await expect(page, from).toHaveURL(new RegExp(`${to}$`));
  }
});

test("ramadan: a gift spread over the last ten nights, more on the odd ones", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00"));
  await page.goto("/ramadan");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your Ramadan giving, in one place");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#nights-amount").fill("140");
  // Ramadan 1448 has 29 days by Umm al-Qura: nights 21 to 29, five of them odd.
  // 140 over 5 × 2 + 4 × 1 shares is $20 on an odd night and $10 on the others.
  const plan = page.getByRole("list", { name: "Your plan, night by night" });
  await expect(plan.getByRole("listitem")).toHaveCount(9);
  await expect(plan.getByRole("listitem").first()).toContainText("Night 21");
  await expect(plan.getByRole("listitem").first()).toContainText("US$20.00");
  await expect(plan.getByRole("listitem").nth(1)).toContainText("US$10.00");
  await page.getByText("The same every night").click();
  await expect(plan.getByRole("listitem").first()).toContainText("US$15.55");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add a reminder for each night" }).click();
  expect((await download).suggestedFilename()).toBe("last-ten-nights.ics");

  // During Ramadan, only the nights still to come.
  await page.clock.setFixedTime(new Date("2027-03-02T10:00:00"));
  await page.reload();
  await page.locator("#nights-amount").fill("60");
  await expect(plan.getByRole("listitem").first()).toContainText("Night 24");
  await expect(plan.getByRole("listitem")).toHaveCount(6);
});

test("farm: a tenth of the harvest, and what each herd owes", async ({ page }) => {
  await page.goto("/farm");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat on crops and animals");

  // 30 maund is 1,200 kg: a tenth by rain, half a tenth by pump.
  await page.locator("#farm-unit").selectOption("maund");
  await page.locator("#farm-harvest").fill("30");
  await expect(page.getByText("Give 3 maund (120 kg)")).toBeVisible();
  await expect(page.getByRole("img", { name: "Of every ten sacks, one is given" })).toBeVisible();
  await page.getByText("A pump, a well, or bought water").click();
  await expect(page.getByText("Give 1.5 maund (60 kg)")).toBeVisible();
  await page.locator("#farm-harvest").fill("10");
  await expect(page.getByText("Below the nisab")).toBeVisible();

  await page.locator("#farm-sheep").fill("150");
  await page.locator("#farm-cattle").fill("70");
  await page.locator("#farm-camels").fill("4");
  await expect(page.getByText("Give 2 sheep or goats")).toBeVisible();
  await expect(page.getByText("Give 1 musinnah and 1 tabi‘")).toBeVisible();
  await expect(page.getByText("Nothing yet: zakat starts at 5")).toBeVisible();

  // Fed or working animals are not counted as livestock.
  await page.getByText("Eat feed you bought or grew").click();
  await expect(page.getByText("Give 2 sheep or goats")).toHaveCount(0);
  await expect(page.getByText(/Imam Malik counts them too/)).toBeVisible();
});

test("family: each person weighed alone, and a warning when pooling misleads", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await page.goto("/family");
  await page.locator("#tool-currency").selectOption("USD");
  // Silver nisab: 595 g at 1.2 is US$714.
  await expect(page.getByText("US$714.00")).toBeVisible();

  const me = page.getByRole("listitem", { name: "Me", exact: true });
  await me.getByLabel("Cash and savings").fill("500");
  await page.getByRole("button", { name: "Wife or husband", exact: true }).click();
  const wife = page.getByRole("listitem", { name: "Wife or husband", exact: true });
  await wife.getByLabel("Cash and savings").fill("400");
  await expect(page.getByRole("heading", { name: "No one in your family owes zakat" })).toBeVisible();
  await expect(page.getByText(/Added together, your family has US\$900\.00/)).toContainText("you and your wife or husband are under the nisab");

  // 10 g of 22k gold is 916 more: now she owes 2.5% of 1,316.
  await wife.getByLabel("Gold, in grams").fill("10");
  await expect(wife.getByText("US$32.90")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your family gives US$32.90" })).toBeVisible();

  // Kept in this browser.
  await page.reload();
  await expect(page.getByRole("listitem", { name: "Wife or husband", exact: true }).getByLabel("Cash and savings")).toHaveValue("400");

  // Your own card uses what you worked out in the calculator, rather than asking again.
  await page.goto("/calculator");
  await page.locator("#calc-cash").fill("2000");
  await page.goto("/family");
  const mine = page.getByRole("listitem", { name: "Me", exact: true });
  await expect(mine.getByText("From your own figures")).toBeVisible();
  await expect(mine.getByText("US$50.00")).toBeVisible();
});

test("quiz: ten picture questions, each answered at once, and a score", async ({ page }) => {
  await page.goto("/quiz");
  await expect(page.getByRole("heading", { name: "The home you live in" })).toBeVisible();
  // A wrong answer is explained.
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.getByText("Not quite")).toBeVisible();
  await expect(page.getByText("A home for your own use is not counted")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeFocused();
  await page.keyboard.press("Enter");

  // The rest answered right.
  for (const yes of [true, false, false, true, true, true, false, false, true]) {
    await page.getByRole("button", { name: yes ? "Yes" : "No", exact: true }).click();
    await expect(page.getByText("Right", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /^(Next|See my score)$/ }).click();
  }
  await expect(page.getByRole("heading", { name: "9 of 10" })).toBeVisible();
  await expect(page.getByRole("link", { name: "No: read why" })).toHaveAttribute("href", "/what-counts#home");
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByRole("heading", { name: "The home you live in" })).toBeVisible();
});

test("sadaqah: one deed for today, and every deed with its source", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T10:00:00"));
  await page.goto("/sadaqah");
  await expect(page.getByRole("heading", { name: "Say a kind word" })).toBeVisible();
  await page.getByRole("button", { name: "Show me another" }).click();
  await expect(page.getByRole("heading", { name: "Move something harmful off the road" })).toBeVisible();

  const cards = page.locator("main ul").first();
  await expect(cards.getByRole("listitem")).toHaveCount(18);
  await cards.getByText("Plant a tree or a seed").click();
  await expect(cards.getByText("Sahih al-Bukhari and Sahih Muslim, from Anas ibn Malik")).toBeVisible();

  // Nothing is counted or kept: sadaqah is given and let go.
  await expect(page.getByText("there is nothing to write down or count")).toBeVisible();
  await expect(page.getByRole("button", { name: /good deed today/ })).toHaveCount(0);
});

test("shop: counted with everything else you own, in the same figures as the calculator", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await page.goto("/shop");
  await expect(page.getByRole("list", { name: "Not counted" }).getByRole("listitem")).toHaveCount(5);
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-business").fill("30000");
  await page.locator("#shop-cash").fill("5000");
  await page.locator("#shop-receivables").fill("2000");
  await page.locator("#shop-debts").fill("7000");
  // 30,000 + 5,000 + 2,000 − 7,000 = 30,000; 2.5% is 750.
  await expect(page.getByRole("heading", { name: "Your zakat: US$750.00" })).toBeVisible();

  // The same figures are the calculator's: nothing typed twice, nothing counted twice.
  await page.goto("/calculator");
  await expect(page.locator("#calc-cash")).toHaveValue("5000");
  await expect(page.getByText("US$750.00").first()).toBeVisible();

  await page.goto("/shop");
  await page.locator("#shop-business").fill("500");
  await page.locator("#shop-cash").fill("0");
  await page.locator("#shop-receivables").fill("0");
  await page.locator("#shop-debts").fill("0");
  await expect(page.getByRole("heading", { name: "Below the nisab: no zakat this year" })).toBeVisible();
});

test("where to give: nearest first, and six questions for a charity", async ({ page }) => {
  await page.goto("/give");
  const near = page.getByRole("region", { name: "Who first: start close, then go outwards" });
  await expect(near.getByRole("listitem").first()).toContainText("Relatives in need");
  const questions = page.getByRole("checkbox");
  await expect(questions).toHaveCount(6);
  for (let i = 0; i < 6; i++) await questions.nth(i).check();
  await expect(page.getByText("Good answers to all six: you can give with confidence.")).toBeVisible();
  // The evidence for giving quietly folds out.
  await page.getByRole("region", { name: "Give it quietly" }).getByText("Evidence").click();
  await expect(page.getByText("Quran 2:271")).toBeVisible();
});

test("bank interest: separated from your money, given away, and left out of zakat", async ({ page }) => {
  await page.goto("/interest");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#interest-balance").fill("10000");
  await page.locator("#interest-paid").fill("300");
  await expect(page.getByText("Give away US$300.00")).toBeVisible();
  await expect(page.getByText("not your zakat")).toBeVisible();
  await expect(page.getByText("count US$9,700.00 from this account")).toBeVisible();
});

test("guides answer the common questions and lead to the calculator", async ({ page }) => {
  await page.goto("/guides");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat on what you own");
  await expect(page.locator("main ul").first().getByRole("link")).toHaveCount(6);
  await page.getByRole("link", { name: /Zakat on gold and silver/ }).click();
  await page.waitForURL("**/guides/zakat-on-gold");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat on gold and silver");
  const types = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")["@type"]));
  expect(types).toEqual(expect.arrayContaining(["Article", "FAQPage"]));
  await page.getByRole("link", { name: "Shares and funds" }).click();
  await page.waitForURL("**/guides/zakat-on-shares");
  await page.getByRole("link", { name: "Calculate your zakat" }).click();
  await page.waitForURL("**/calculator");

  expect((await page.request.get("/guides/zakat-on-yachts")).status()).toBe(404);
});

test("pages can be shared, and nisab links preview today’s figures", async ({ page }) => {
  await page.goto("/calculator");
  const share = page.getByRole("group", { name: "Share the calculator" });
  if (await share.count()) {
    const href = await share.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const text = decodeURIComponent(href!.split("text=")[1]);
    expect(text).toContain("free, private zakat calculator");
    expect(text).toMatch(/http:\/\/localhost:3210\/calculator$/);
    await expect(share.getByRole("button", { name: "Copy link" })).toBeVisible();
  } else {
    // A browser with its own share sheet gets a single button instead.
    await expect(page.getByRole("button", { name: "Share the calculator" })).toBeVisible();
  }

  const card = await page.request.get("/nisab/pkr/opengraph-image");
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toBe("image/png");
  await page.goto("/nisab/pkr");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/nisab\/pkr\/opengraph-image/,
  );
});

test("missed fasts: the reason says what to do, the count goes down, and My zakat keeps it", async ({ page }) => {
  await page.goto("/fasts");
  // Someone who was ill is asked one thing: how many days.
  await page.getByRole("button", { name: "I was ill or travelling" }).click();
  await expect(page.getByRole("status")).toContainText("Make up each day you missed");
  await expect(page.locator("#fasts-fidya-days")).toHaveCount(0);
  await page.locator("#fasts-owed").fill("5");
  await page.getByRole("button", { name: "I made up a fast" }).click();
  await page.getByRole("button", { name: "I made up a fast" }).click();
  await expect(page.getByText("3 fasts left · 2 made up")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Remind me on Mondays and Thursdays" }).click();
  expect((await download).suggestedFilename()).toBe("make-up-fasts.ics");

  // Each other reason opens only what it needs.
  await page.getByRole("button", { name: "I am too old or ill to ever fast" }).click();
  await expect(page.getByRole("status")).toContainText("feed one poor person for each day");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#fasts-per-day").fill("8");
  await page.locator("#fasts-fidya-days").fill("30");
  await expect(page.getByText("Fidya: US$240.00 (30 meals)")).toBeVisible();
  await page.getByRole("button", { name: "I broke a fast on purpose" }).click();
  await page.locator("#fasts-kaffarah").fill("1");
  await expect(page.getByText(/Fast 60 days in a row/)).toBeVisible();
  await page.getByRole("button", { name: "I swore an oath and broke it" }).click();
  await page.locator("#fasts-oaths").fill("1");
  await expect(page.getByText(/Feed or clothe 10 poor people/)).toContainText("US$80.00");

  // My zakat counts what is left and puts it on the list.
  await page.goto("/my");
  await expect(page.getByRole("region", { name: "What to do next" })).toContainText("Make up 3 missed fasts before Ramadan");
  await expect(page.getByText("3 fasts to make up · US$320.00 to give · 60 days of kaffarah")).toBeVisible();

  // And Ask finds it.
  await page.goto("/ask?q=fidya");
  await expect(page.getByRole("region", { name: "Answers" }).getByText("Too old or ill to fast: fidya")).toBeVisible();
});
