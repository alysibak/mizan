import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { daysAgo, registerAndSetUp, uniqueEmail } from "./helpers";

// WCAG 2.1 A and AA rules, light and dark, on the pages people land on and
// the pages they use most.
async function violations(page: Page, label: string): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations.map(
    (v) =>
      `${label} :: ${v.id} (${v.impact}) ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`,
  );
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    // Entrance animations fade text in; axe would measure it half-faded.
    test.use({ colorScheme: scheme, contextOptions: { reducedMotion: "reduce" } });
    // Many pages per test; each is loaded and audited in turn.
    test.describe.configure({ timeout: 240_000 });

    test("public pages meet WCAG AA", async ({ page }) => {
      await page.route("**/api/metals?*", (route) =>
        route.fulfill({
          json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" },
        }),
      );
      const found: string[] = [];
      for (const path of [
        "/",
        "/calculator",
        "/bn/guide",
        "/ur/guide",
        "/guide",
        "/ar/guide",
        "/who-can-receive",
        "/fasts",
        "/debts",
        "/ur/zakat-al-fitr",
        "/what-counts",
        "/missed-years",
        "/ar/missed-years",
        "/ask",
        "/ur/ask",
        "/worksheet",
        "/ar/worksheet",
        "/ar/sources",
        "/poster",
        "/nisab",
        "/nisab/usd",
        "/ar",
        "/ar/calculator",
        "/ur/calculator",
        "/fr/nisab/eur",
        "/ramadan",
        "/farm",
        "/family",
        "/quiz",
        "/sadaqah",
        "/shop",
        "/give",
        "/interest",
        "/my",
        "/zakat-al-fitr",
        "/guides",
        "/guides/zakat-on-pensions",
        "/login",
        "/register",
        "/privacy",
        "/method",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("load");
        await page.waitForTimeout(250); // let hydration settle
        found.push(...(await violations(page, path)));
      }
      expect(found).toEqual([]);
    });

    test("My zakat in use meets WCAG AA", async ({ page }) => {
      await page.route("**/api/metals?*", (route) =>
        route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
      );
      await page.goto("/my");
      await page.evaluate(() => {
        localStorage.setItem("mizan-visitor-currency", "USD");
        localStorage.setItem(
          "mizan-calculator-v1",
          JSON.stringify({
            v: 1, currency: "USD", decimal: ".", goldPrice: "", silverPrice: "", pricesAsOf: null,
            amounts: { cash: "20000" }, byWeight: {}, grams: {}, purity: {}, portions: {}, debts: "",
            standard: "silver", basis: "lunar", jewelleryCounted: false, given: "100", weightUnit: null,
          }),
        );
        localStorage.setItem(
          "mizan-my-v1",
          JSON.stringify({
            zakatDay: { month: 9, day: 1 },
            payments: [{ id: "a", day: "2026-10-01", amount: 100, to: "My brother" }],
            history: [{ hijriYear: 1447, currency: "USD", due: 400, given: 400, closed: "2026-02-20" }],
          }),
        );
        localStorage.setItem("mizan-interest-v1", JSON.stringify({ balance: "1000", interest: "20", given: false }));
      });
      await page.reload();
      await expect(page.getByRole("region", { name: "Your record" })).toBeVisible();
      // The monthly plan, the code for a new phone, and the code form.
      await page.getByRole("button", { name: "Move to a new phone" }).click();
      await expect(page.getByText("Works once")).toBeVisible();
      await page.getByRole("button", { name: "I have a code" }).click();
      expect(await violations(page, "/my in use")).toEqual([]);

      await page.goto("/my?move=K7P4QX2M");
      await expect(page.getByRole("region", { name: "From your old phone" })).toBeVisible();
      expect(await violations(page, "/my arriving with a code")).toEqual([]);
    });

    test("the menu meets WCAG AA", async ({ page }) => {
      const found: string[] = [];
      for (const path of ["/", "/ur"]) {
        await page.goto(path);
        await page.locator("header button[aria-haspopup=dialog]").click();
        await expect(page.getByRole("dialog")).toBeVisible();
        found.push(...(await violations(page, `${path} menu`)));
      }
      expect(found).toEqual([]);
    });

    test("the signed-in app meets WCAG AA", async ({ page }) => {
      await registerAndSetUp(page, {
        email: uniqueEmail(`a11y-${scheme}`),
        hawlStart: daysAgo(100),
        amount: "5000",
      });
      const found: string[] = [];
      for (const path of [
        "/dashboard",
        "/assets",
        "/year",
        "/giving",
        "/zakat",
        "/statement",
        "/settings",
        "/tools/reckoning-night",
        "/tools/forgotten",
        "/tools/envelopes",
        "/tools/forgive",
        "/privacy",
        "/method",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("load");
        await page.waitForTimeout(250); // let hydration settle
        found.push(...(await violations(page, path)));
      }
      expect(found).toEqual([]);
    });
  });
}
