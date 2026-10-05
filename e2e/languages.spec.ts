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

  // The language picker keeps you on the same page.
  await page.getByRole("link", { name: "Türkçe" }).click();
  await page.waitForURL("**/tr/calculator");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu yıl zekâtınız ne kadar?");
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
  await page.waitForURL("**/calculator?currency=EUR");
  await expect(page.locator("#calc-currency")).toHaveValue("EUR");
  await expect(page.locator("#calc-silver-price")).toHaveValue("0.9");

  const missing = await page.goto("/nisab/xyz");
  expect(missing?.status()).toBe(404);
});
