import { test, expect } from "@playwright/test";

// The free tools work without an account, in the visitor's chosen currency,
// and point to a free ledger rather than to pages behind sign-in.

test("inheritance: Quranic shares with cash amounts", async ({ page }) => {
  await page.goto("/inheritance");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Islamic inheritance calculator");
  await page.locator("#tool-currency").selectOption("GBP");
  await page.locator("#estate").fill("90000");
  await page.getByRole("spinbutton", { name: "Husband" }).fill("1");
  await page.getByRole("spinbutton", { name: "Full sister" }).fill("1");
  const table = page.getByRole("region", { name: "Division of the estate" });
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(table.getByRole("row", { name: /Husband/ })).toContainText("1/2");
  await expect(table.getByRole("row", { name: /Husband/ })).toContainText("£45,000.00");
  await expect(table.getByRole("row", { name: /Full sister/ })).toContainText("£45,000.00");

  // The currency choice carries to the next tool.
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

test("halal stocks: ratios and dividend purification", async ({ page }) => {
  await page.goto("/halal-stocks");
  await page.locator("#marketCap").fill("1000");
  await page.locator("#totalAssets").fill("800");
  await page.locator("#interestBearingDebt").fill("100");
  await page.locator("#cashAndInterestSecurities").fill("50");
  await page.locator("#totalRevenue").fill("500");
  await page.locator("#impermissibleRevenue").fill("10");
  await page.getByRole("button", { name: "Screen this stock" }).click();
  await expect(page.getByRole("heading", { name: "Meets these checks" })).toBeVisible();
  await page.locator("#tool-currency").selectOption("CAD");
  await page.locator("#dividend").fill("200");
  // 10 / 500 = 2% of 200.
  await expect(page.getByText(/^Give away/)).toContainText("$4.00");
  await expect(page.getByRole("link", { name: "Record purification" })).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Alcohol" }).check();
  await page.getByRole("button", { name: "Screen this stock" }).click();
  await expect(page.getByRole("heading", { name: "Does not meet these checks" })).toBeVisible();
});

test("qurbani: shares of a cow", async ({ page }) => {
  await page.goto("/qurbani");
  await page.locator("#tool-currency").selectOption("EUR");
  await page.locator("#animal").selectOption("cow");
  await page.locator("#cost").fill("1400");
  await page.locator("#shares").fill("2");
  await expect(page.getByText("Per share")).toBeVisible();
  await expect(page.locator("dl")).toContainText("€200.00");
  await expect(page.locator("dl")).toContainText("€400.00");
});

test("every tool page is linked from the footer and has no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  for (const name of [
    "Ramadan giving",
    "Where to give",
    "Bank interest",
    "Sadaqah without money",
    "Zakat quiz",
    "Family zakat",
    "Shop zakat",
    "Crops and animals",
    "Inheritance calculator",
    "Zakat al-Fitr",
    "Halal stock screen",
    "Qurbani shares",
  ]) {
    const link = page.getByRole("contentinfo").getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  }
  for (const path of ["/ramadan", "/give", "/interest", "/sadaqah", "/quiz", "/family", "/shop", "/farm", "/inheritance", "/zakat-al-fitr", "/halal-stocks", "/qurbani"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
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

  // A good deed marked today fills in the day and starts a streak, kept on the device.
  await page.getByRole("button", { name: "I did a good deed today" }).click();
  await expect(page.getByRole("button", { name: "✓ Done today" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("table", { name: "October 2026" }).getByText("11 (done)")).toBeAttached();
  await page.reload();
  await expect(page.getByRole("button", { name: "✓ Done today" })).toBeVisible();
});

test("shop: stock, till, and money owed counted; suppliers taken off", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await page.goto("/shop");
  await expect(page.getByRole("list", { name: "Not counted" }).getByRole("listitem")).toHaveCount(5);
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-stock").fill("30000");
  await page.locator("#shop-cash").fill("5000");
  await page.locator("#shop-owedToYou").fill("2000");
  await page.locator("#shop-owedBySuppliers").fill("7000");
  // 30,000 + 5,000 + 2,000 − 7,000 = 30,000; 2.5% is 750.
  await expect(page.getByRole("heading", { name: "Your zakat: US$750.00" })).toBeVisible();
  await page.locator("#shop-stock").fill("500");
  await page.locator("#shop-cash").fill("0");
  await page.locator("#shop-owedToYou").fill("0");
  await page.locator("#shop-owedBySuppliers").fill("0");
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
