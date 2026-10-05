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
        "/nisab",
        "/nisab/usd",
        "/ar",
        "/ar/calculator",
        "/ur/calculator",
        "/fr/nisab/eur",
        "/login",
        "/register",
        "/privacy",
        "/method",
        "/trust",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("load");
        await page.waitForTimeout(250); // let hydration settle
        found.push(...(await violations(page, path)));
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
        "/tools",
        "/tools/reckoning-night",
        "/tools/forgotten",
        "/tools/what-if",
        "/tools/envelopes",
        "/tools/reverse",
        "/tools/forgive",
        "/tools/udhiyah",
        "/tools/fitr",
        "/tools/asnaf",
        "/screening",
        "/mirath",
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
