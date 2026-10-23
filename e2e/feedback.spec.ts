import { expect, test, type Page } from "@playwright/test";
import { ADMIN, asNewVisitor, daysAgo, registerAndSetUp, watchConsole } from "./helpers";

// Live price sources are outside the test's control; answer for them.
const PRICES = {
  currency: "USD",
  goldPricePerGram: 100,
  silverPricePerGram: 1.2,
  asOf: "2026-10-05T12:00:00.000Z",
  source: "test prices",
};

async function stepCount(page: Page, step: string): Promise<number> {
  const text = await page.locator(`[data-step=${step}]`).innerText();
  return Number(text.match(/([\d,]+)\s*$/)?.[1].replace(/,/g, "") ?? NaN);
}

test("testers say whether it was easy, and the admin page shows what they said and how far people got", async ({
  page,
}) => {
  const errors = watchConsole(page);
  await asNewVisitor(page);
  await page.route("**/api/metals?*", (route) => route.fulfill({ json: PRICES }));

  // The main journey: a number on the home page, then the guide to its answer.
  await page.goto("/");
  await page.fill("#quick-amount", "20000");
  await page.getByRole("link", { name: "Get the exact answer, step by step" }).click();
  await page.waitForURL("**/guide");
  const show = page.getByRole("button", { name: "Show my zakat" });
  while (!(await show.isVisible())) await page.getByRole("button", { name: "Next" }).click();
  await show.click();
  await expect(page.getByRole("heading", { name: /Your zakat is/ })).toBeVisible();

  // Two faces to tap, then a line if they want.
  const ask = page.getByRole("region", { name: "Was this easy?" });
  await ask.getByRole("button", { name: "Not really" }).click();
  await ask.getByLabel("Sorry about that. What was hard?").fill("The debts step was hard to understand");
  await ask.getByRole("button", { name: "Send" }).click();
  await expect(ask.getByText("Thank you. It helps make Mizan easier for everyone.")).toBeVisible();

  // Asked once: the answer again does not ask again.
  await page.reload();
  while (!(await show.isVisible())) await page.getByRole("button", { name: "Next" }).click();
  await show.click();
  await expect(page.getByRole("heading", { name: /Your zakat is/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Was this easy?" })).toHaveCount(0);

  // Home in an account asks too, separately.
  await registerAndSetUp(page, { email: ADMIN, hawlStart: daysAgo(100), amount: "5000" });
  const home = page.getByRole("region", { name: "Was this easy?" });
  await home.getByRole("button", { name: "Yes" }).click();
  await home.getByRole("button", { name: "Send" }).click();
  await expect(home.getByText("Thank you. It helps make Mizan easier for everyone.")).toBeVisible();

  // The admin sees both answers, the line, and the journey, with nobody named.
  await page.goto("/admin/feedback");
  await expect(page.getByRole("heading", { name: "What people said" })).toBeVisible();
  await expect(page.getByText("The debts step was hard to understand")).toBeVisible();
  await expect(page.getByText(/Not really · Guide answer · English/)).toBeVisible();
  await expect(page.getByText(/Easy · Account Home · English/)).toBeVisible();
  for (const step of ["home", "typed", "guide", "answer", "signup", "setup"]) {
    expect(await stepCount(page, step), step).toBeGreaterThanOrEqual(1);
  }
  await page.getByRole("link", { name: "Accounts" }).click();
  await expect(page.getByRole("heading", { name: "Who has entered" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the admin pages are for the admin only", async ({ page }) => {
  await page.goto("/admin/feedback");
  await expect(page).toHaveURL(/\/login/);
});
