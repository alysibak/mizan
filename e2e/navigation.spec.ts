import { test, expect } from "@playwright/test";
import { daysAgo, registerAndSetUp, uniqueEmail } from "./helpers";

// A visitor never has to scroll to the footer to find their way: the menu is
// at the top of every page, a returning visitor is offered what they started,
// and every tool ends with where to go next.

test("the menu at the top opens everything, grouped by what you want to do", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  for (const group of ["Work out my zakat", "Give it", "Learn"]) {
    await expect(menu.getByRole("heading", { name: group })).toBeVisible();
  }
  await menu.getByRole("link", { name: "Crops and animals" }).click();
  await page.waitForURL("**/farm");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Escape closes it without going anywhere.
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the menu speaks the page's language", async ({ page }) => {
  await page.goto("/ur");
  await page.getByRole("button", { name: "مینو" }).click();
  const menu = page.getByRole("dialog", { name: "مینو" });
  await expect(menu.getByRole("heading", { name: "اپنی زکوٰۃ نکالیں" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "سوال پوچھیں" })).toHaveAttribute("href", "/ur/ask");
});

test("the top bar stays in view on a long page", async ({ page }) => {
  await page.goto("/sadaqah");
  await page.mouse.wheel(0, 3000);
  await expect(page.getByRole("button", { name: "Menu" })).toBeInViewport();
});

test("someone coming back is offered what they started", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pick up where you left off" })).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem(
      "mizan-calculator-v1",
      JSON.stringify({
        v: 1,
        currency: "USD",
        decimal: ".",
        goldPrice: "100",
        silverPrice: "1.2",
        pricesAsOf: "2026-10-19T10:00:00.000Z",
        amounts: { cash: "20000" },
        byWeight: {},
        grams: {},
        purity: {},
        portions: {},
        debts: "",
        standard: "silver",
        basis: "lunar",
        jewelleryCounted: false,
        given: "200",
      }),
    );
    localStorage.setItem("mizan-fasts-v1", JSON.stringify({ owed: "4", madeUp: 1 }));
  });
  await page.reload();
  const back = page.getByRole("region", { name: "Pick up where you left off" });
  await expect(back.getByText("Your zakat is US$500")).toBeVisible();
  await expect(back.getByText("Still to give: US$300")).toBeVisible();
  // The same words as My zakat, from the one list of what the phone keeps.
  await expect(back.getByText("3 fasts to make up")).toBeVisible();
  await back.getByRole("link", { name: /Your zakat is/ }).click();
  await page.waitForURL("**/my");
});

test("the guide asks what they have, and points to the pages for the rest", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await page.goto("/guide");
  await page.getByRole("button", { name: "Money in the bank" }).click();
  await page.getByRole("button", { name: "A shop" }).click();
  await page.getByRole("button", { name: "Years I did not pay" }).click();
  await expect(page.getByRole("button", { name: "A shop" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next" }).click();
  await page.fill("#guide-bank", "10000");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Show my zakat" }).click();
  await expect(page.getByRole("heading", { name: /Your zakat is/ })).toBeVisible();
  await page.getByRole("link", { name: /Catch up on the years you did not pay/ }).click();
  await page.waitForURL("**/missed-years");
});

test("a tool ends with where to go next, straight under it", async ({ page }) => {
  await page.goto("/farm");
  const next = page.getByRole("navigation", { name: "What next?" });
  await expect(next.getByRole("link")).toHaveCount(2);
  await next.getByRole("link", { name: /Where to give it/ }).click();
  await page.waitForURL("**/give");
});

test("the menu's search box leads straight to the answers", async ({ page }) => {
  await page.goto("/farm");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await menu.getByLabel("What do you want to know?").fill("gold");
  await menu.getByLabel("What do you want to know?").press("Enter");
  await page.waitForURL("**/ask?q=gold");
  await expect(page.locator("#ask-q")).toHaveValue("gold");
  await expect(page.getByRole("heading", { name: "Answers" })).toBeVisible();
});

test("a near zakat day is announced on every page until dismissed", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-02-01T10:00:00"));
  await page.goto("/guide");
  await expect(page.getByText("Your zakat day is in")).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem("mizan-my-v1", JSON.stringify({ zakatDay: { month: 9, day: 1 } })));
  await page.reload();
  await expect(page.getByText("Your zakat day is in 7 days.")).toBeVisible();
  await page.getByRole("link", { name: "Open My zakat" }).click();
  await page.waitForURL("**/my");
  await expect(page.getByText("Your zakat day is in 7 days.")).toHaveCount(0);
  await page.goto("/guide");
  await page.getByRole("button", { name: "Hide until next year" }).click();
  await expect(page.getByText("Your zakat day is in")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Your zakat day is in")).toHaveCount(0);
});

test("signed in, the Mizan logo leads home to all of Mizan, and back to the account", async ({ page }) => {
  // Google is off on this server: no button that could not work.
  await page.goto("/register");
  await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveCount(0);

  await registerAndSetUp(page, { email: uniqueEmail("logo"), hawlStart: daysAgo(30), amount: "1000" });
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Mizan", exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL((url) => url.pathname === "/");
  const account = page.getByRole("banner").getByRole("link", { name: "My account" });
  await expect(account).toBeVisible();
  await account.click();
  await page.waitForURL("**/dashboard");
});
