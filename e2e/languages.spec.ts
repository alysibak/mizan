import { test, expect } from "@playwright/test";
import { expectNoHorizontalScroll, expectUniqueIds, watchConsole } from "./helpers";

const PRICES = {
  currency: "SAR",
  goldPricePerGram: 320,
  silverPricePerGram: 3.75,
  asOf: "2026-10-05T12:00:00.000Z",
  source: "test prices",
};

test("Arabic reads right to left and takes Arabic-Indic digits", async ({ page }) => {
  const errors = watchConsole(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));
  await page.goto("/ar/calculator");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("كم زكاتك هذا العام؟");

  await page.selectOption("#calc-currency", "SAR");
  await expect(page.locator("#calc-silver-price")).toHaveValue("3.75");
  await page.fill("#calc-cash", "٥٠٠٠٠"); // 50,000 in Arabic-Indic digits
  await page.fill("#calc-bank", "١٠٠٠٠٠");
  // 150,000 × 2.5% = 3,750
  await expect(page.locator("#result")).toContainText("3,750.00");
  await expectNoHorizontalScroll(page);
  await expectUniqueIds(page);
  expect(errors).toEqual([]);
});

test("every language has its landing page and calculator, linked for search engines", async ({
  page,
  request,
}) => {
  for (const locale of ["ar", "ur", "id", "ms", "tr", "fr"]) {
    for (const path of [`/${locale}`, `/${locale}/calculator`]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  }
  expect((await request.get("/xx/calculator")).status()).toBe(404);

  await page.goto("/calculator");
  const hreflang = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
  expect(hreflang).toEqual(expect.arrayContaining(["en", "ar", "ur", "id", "ms", "tr", "fr", "x-default"]));

  // The footer's language links keep you on the same page.
  await page.getByRole("contentinfo").getByRole("link", { name: "Türkçe" }).click();
  await page.waitForURL("**/tr/calculator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu yıl zekâtınız ne kadar?");
  for (const locale of ["ar", "ur", "id", "ms", "tr", "fr"]) {
    expect((await request.get(`/${locale}/start`)).status(), locale).toBe(200);
  }
});

test("the header switches language in two taps, and the choice is offered back", async ({
  page,
}) => {
  await page.goto("/calculator");
  const header = page.getByRole("banner");
  await header.locator("summary", { hasText: "English" }).click();
  await header.getByRole("link", { name: "اردو" }).click();
  await page.waitForURL("**/ur/calculator");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("banner").getByText("یہ صفحہ اردو میں پڑھیں")).toHaveCount(0);

  // Landing on an English page later, the chosen language is one tap away.
  await page.goto("/nisab");
  const offer = page.getByRole("link", { name: "یہ صفحہ اردو میں پڑھیں" });
  await expect(offer).toBeVisible();
  await offer.click();
  await page.waitForURL("**/ur/nisab");

  // "Not now" puts it away.
  await page.goto("/start");
  await page.getByRole("button", { name: "ابھی نہیں" }).click();
  await expect(page.getByRole("link", { name: "یہ صفحہ اردو میں پڑھیں" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zakat, in plain words");
  await expect(page.getByRole("link", { name: "یہ صفحہ اردو میں پڑھیں" })).toHaveCount(0);
});

test("nisab pages answer for every currency and lead into the calculator", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { ...PRICES, currency: "EUR", goldPricePerGram: 80, silverPricePerGram: 0.9 } }),
  );
  await page.goto("/nisab");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nisab today");
  await page.getByRole("link", { name: "Euro" }).first().click();
  await page.waitForURL("**/nisab/eur");
  // Live figures when the price sources answer, a clear notice when not.
  await expect(
    page.getByText("Silver nisab · 595 g").or(page.getByText("Live prices are unavailable")),
  ).toBeVisible();

  await page.getByRole("link", { name: "Calculate your zakat in EUR" }).click();
  await page.waitForURL(/\/calculator/);
  await expect(page.locator("#calc-currency")).toHaveValue("EUR");
  await expect(page.locator("#calc-silver-price")).toHaveValue("0.9");
  // The link's currency is applied once; a reload keeps the visitor's own choice.
  await expect(page).toHaveURL(/\/calculator$/);
  await page.locator("#calc-currency").selectOption("GBP");
  await page.reload();
  await expect(page.locator("#calc-currency")).toHaveValue("GBP");

  const missing = await page.goto("/nisab/xyz");
  expect(missing?.status()).toBe(404);
});
