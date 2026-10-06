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
  for (const name of ["Inheritance calculator", "Zakat al-Fitr", "Halal stock screen", "Qurbani shares"]) {
    const link = page.getByRole("contentinfo").getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  }
  for (const path of ["/inheritance", "/zakat-al-fitr", "/halal-stocks", "/qurbani"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
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
