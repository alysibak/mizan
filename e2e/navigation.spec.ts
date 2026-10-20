import { test, expect } from "@playwright/test";

// A visitor never has to scroll to the footer to find their way: the menu is
// at the top of every page, a returning visitor is offered what they started,
// and every tool ends with where to go next.

test("the menu at the top opens everything, grouped by what you want to do", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  for (const group of ["Work out my zakat", "Give it", "Learn", "More tools"]) {
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
    localStorage.setItem("mizan-sadaqah-days-v1", JSON.stringify(["2026-01-01"]));
  });
  await page.reload();
  const back = page.getByRole("region", { name: "Pick up where you left off" });
  await expect(back.getByText("Your zakat is US$500.00")).toBeVisible();
  await expect(back.getByText("Still to give: US$300.00")).toBeVisible();
  await expect(back.getByText("Your good deeds")).toBeVisible();
  await back.getByRole("link", { name: /Your zakat is/ }).click();
  await page.waitForURL("**/my");
});

test("a visitor who does not know where to start gets their own plan, in order", async ({ page }) => {
  await page.goto("/");
  const picker = page.getByRole("region", { name: "What do you have?" });
  await picker.getByRole("button", { name: "A shop or business" }).click();
  await picker.getByRole("button", { name: "Interest from a bank" }).click();
  await picker.getByRole("button", { name: "Years I did not pay" }).click();
  await expect(picker.getByRole("button", { name: "A shop or business" })).toHaveAttribute("aria-pressed", "true");
  const steps = picker.getByRole("list").last().getByRole("link");
  await expect(steps).toHaveCount(5);
  await expect(steps.nth(0)).toContainText("Set the bank interest aside first");
  await expect(steps.nth(1)).toContainText("Work out your shop with your savings");
  await expect(steps.nth(2)).toContainText("Then catch up on past years");
  await expect(steps.nth(3)).toContainText("Give it");
  await expect(steps.nth(4)).toContainText("Keep track in My zakat");
  await steps.nth(1).click();
  await page.waitForURL("**/shop");
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
  await page.goto("/start");
  await expect(page.getByText("Your zakat day is in")).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem("mizan-my-v1", JSON.stringify({ zakatDay: { month: 9, day: 1 } })));
  await page.reload();
  await expect(page.getByText("Your zakat day is in 7 days.")).toBeVisible();
  await page.getByRole("link", { name: "Open My zakat" }).click();
  await page.waitForURL("**/my");
  await expect(page.getByText("Your zakat day is in 7 days.")).toHaveCount(0);
  await page.goto("/start");
  await page.getByRole("button", { name: "Hide until next year" }).click();
  await expect(page.getByText("Your zakat day is in")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Your zakat day is in")).toHaveCount(0);
});
