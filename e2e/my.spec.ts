import { test, expect } from "@playwright/test";
import { PASSWORD, asNewVisitor, registerAndSetUp, uniqueEmail } from "./helpers";

// My zakat: one person's zakat year, fed by every page and kept on the phone.

test.beforeEach(async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await page.clock.setFixedTime(new Date("2026-10-20T10:00:00"));
});

test("a newcomer is told what to do first, and chooses a zakat day with a yearly reminder", async ({ page }) => {
  await page.goto("/my");
  const todo = page.getByRole("region", { name: "What to do next" });
  await expect(todo.getByRole("link")).toHaveCount(2);
  await expect(todo.getByRole("link").first()).toContainText("Work out this year’s zakat");
  // The day picker waits for the list's second step.
  await expect(page.getByRole("heading", { name: "Choose your zakat day" })).toHaveCount(0);
  await todo.getByRole("link", { name: /Choose your zakat day/ }).click();

  await page.getByRole("button", { name: "1 Ramadan" }).click();
  const day = page.getByRole("region", { name: "Your zakat day" });
  await expect(day).toContainText("1 Ramadan");
  await expect(day).toContainText("Monday, February 8, 2027, in 111 days.");
  const download = page.waitForEvent("download");
  await day.getByRole("button", { name: "Remind me every year" }).click();
  expect((await download).suggestedFilename()).toBe("zakat-day.ics");

  // Kept for next time, and no longer on the to-do list.
  await page.reload();
  await expect(page.getByRole("region", { name: "Your zakat day" })).toContainText("1 Ramadan");
  await expect(page.getByRole("region", { name: "What to do next" }).getByRole("link")).toHaveCount(1);
});

test("what is worked out anywhere is here; payments are noted until it is all given, then kept in a record", async ({ page }) => {
  await page.goto("/shop");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-business").fill("30000");
  await page.getByRole("link", { name: /Saved in My zakat/ }).click();
  await page.waitForURL("**/my");

  const year = page.getByRole("region", { name: "This year’s zakat" });
  await expect(year).toContainText("US$750");
  await expect(year).toContainText("Business stock for sale");

  const given = page.getByRole("region", { name: "What you have given" });
  await page.locator("#my-amount").fill("300");
  await page.locator("#my-to").fill("My brother");
  await page.getByRole("button", { name: "Add to what I have given" }).click();
  await expect(given).toContainText("US$300 of US$750 · US$450 left");
  await expect(given).toContainText("My brother");

  // The calculator sees the same total given.
  await page.goto("/calculator");
  await expect(page.locator("#calc-given")).toHaveValue("300");

  await page.goto("/my");
  await page.locator("#my-amount").fill("450");
  await page.getByRole("button", { name: "Add to what I have given" }).click();
  await expect(page.getByRole("region", { name: "What you have given" })).toContainText("all given");
  await page.getByRole("button", { name: "Close this year and keep a record" }).click();
  const record = page.getByRole("region", { name: "Your record" });
  await expect(record).toContainText("1448 AH");
  await expect(record).toContainText("US$750 given of US$750");
});

test("a copy can be saved and restored on another phone", async ({ page, browser }) => {
  await page.goto("/my#zakat-day");
  await page.getByRole("button", { name: "1 Ramadan" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save a copy" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("mizan-2026-10-20.json");
  const path = await file.path();

  // A fresh phone: nothing kept, then the copy restored.
  const other = await browser.newPage();
  await other.goto(new URL("/my", page.url()).toString());
  await expect(other.getByRole("region", { name: "What to do next" })).toBeVisible();
  await other.locator("input[type=file]").setInputFiles(path!);
  await expect(other.getByRole("status")).toHaveText("Restored. Everything from your copy is back.");
  await expect(other.getByRole("region", { name: "Your zakat day" })).toContainText("1 Ramadan");
  await other.close();
});

test("bank interest set aside on its page is a to-do until it is given away", async ({ page }) => {
  await page.goto("/interest");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#interest-balance").fill("10000");
  await page.locator("#interest-paid").fill("300");
  await page.goto("/my");
  await expect(page.getByRole("region", { name: "What to do next" })).toContainText("Give away the bank interest");
  await expect(page.getByText("US$300 to give away")).toBeVisible();

  await page.goto("/interest");
  await page.getByRole("checkbox", { name: /I have given away/ }).check();
  await page.goto("/my");
  await expect(page.getByRole("region", { name: "What to do next" })).not.toContainText("bank interest");
  await expect(page.getByText("US$300 given away")).toBeVisible();
});

test("opening an account brings My zakat along: the year starts on the zakat day, and what was given is in the ledger", async ({ page }) => {
  await page.goto("/my");
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
        given: "150",
      }),
    );
    localStorage.setItem(
      "mizan-my-v1",
      JSON.stringify({
        zakatDay: { month: 9, day: 1 },
        payments: [{ id: "a", day: "2026-10-01", amount: 150, to: "Masjid al-Noor" }],
        history: [],
      }),
    );
  });
  await asNewVisitor(page);
  await page.goto("/register?from=calculator");
  await page.fill("#name", "Hub Test");
  await page.fill("#email", uniqueEmail("hub"));
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/begin");

  // 1 Ramadan 1447 fell on 18 February 2026: that is when this year began.
  await expect(page.locator("#hawl")).toHaveValue("2026-02-18");
  await expect(page.getByText("From My zakat: your zakat day, 1 Ramadan")).toBeVisible();
  await page.click("button:has-text('Continue')");
  await expect(page.getByText("Zakat already given (1 payment)")).toBeVisible();
  await page.click("text=Bring these in and finish");
  await page.waitForURL(/\/dashboard/);

  await page.goto("/giving");
  await expect(page.getByText("Masjid al-Noor").first()).toBeVisible();
  // The payment now lives in the ledger, so it is not kept twice on the phone.
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("mizan-my-v1") ?? "{}"));
  expect(kept.payments).toEqual([]);
  expect(kept.zakatDay).toEqual({ month: 9, day: 1 });

  // Signed in, My zakat points to the ledger rather than starting again.
  await page.goto("/my");
  const todo = page.getByRole("region", { name: "What to do next" });
  await expect(todo.getByRole("link").first()).toContainText("See this year’s zakat in your account");
  await expect(page.getByRole("link", { name: "Open a free account" })).toHaveCount(0);
  await page.getByRole("link", { name: "Open my account" }).click();
  await page.waitForURL(/\/dashboard/);
});

test("someone already signed in adds what they worked out on this phone to the ledger they have", async ({ page }) => {
  await registerAndSetUp(page, { email: uniqueEmail("phone"), hawlStart: "2026-01-01", amount: "1000" });
  await expect(page.getByText("You have figures on this phone")).toHaveCount(0);

  await page.goto("/calculator");
  await page.selectOption("#calc-currency", "CAD");
  await page.fill("#calc-cash", "2000");
  await page.fill("#calc-bank", "1000");
  await page.goto("/my");
  await page.locator("#my-amount").fill("25");
  await page.locator("#my-to").fill("Food bank");
  await page.getByRole("button", { name: "Add to what I have given" }).click();

  // The dashboard says they are waiting; the calculator offers the ledger, not a new account.
  await page.goto("/dashboard");
  await expect(page.getByText("You have figures on this phone")).toBeVisible();
  await page.goto("/calculator");
  await expect(page.getByRole("link", { name: "Make a free account" })).toHaveCount(0);
  await page.getByRole("link", { name: "Add to my account" }).click();
  await page.waitForURL("**/assets#from-phone");

  const card = page.getByRole("region", { name: "From this phone" });
  await expect(card.getByRole("checkbox")).toHaveCount(3);
  // The bank balance is already in the ledger as "Chequing": leave it out.
  await card.getByRole("checkbox", { name: /Bank balances/ }).uncheck();
  await card.getByRole("button", { name: "Add the 2 ticked" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added" })).toBeVisible();
  await expect(page.locator("li", { hasText: "Cash in hand" })).toContainText("2,000");
  // Only the one bank account the ledger already had.
  await expect(page.getByRole("button", { name: /Edit$/ })).toHaveCount(2);

  await page.goto("/giving");
  await expect(page.getByText("Food bank").first()).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("You have figures on this phone")).toHaveCount(0);
});

test("what is left can be spread over the months before the zakat day, with a reminder each month", async ({ page }) => {
  await page.goto("/shop");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-business").fill("20000");
  await page.goto("/my");
  const given = page.getByRole("region", { name: "What you have given" });
  await expect(given).toContainText("what is left can be spread over the months before it");

  await page.getByRole("button", { name: "1 Ramadan" }).click();
  const plan = given.getByRole("region", { name: /Too much at once/ });
  await expect(plan).toContainText("US$125 a month");
  await expect(plan.getByRole("listitem")).toHaveCount(4);
  await expect(plan.getByRole("listitem").first()).toContainText("Today");
  const download = page.waitForEvent("download");
  await plan.getByRole("button", { name: "Remind me each month" }).click();
  expect((await download).suggestedFilename()).toBe("zakat-each-month.ics");

  // This month's share given: the plan moves on to next month.
  await page.locator("#my-amount").fill("125");
  await page.getByRole("button", { name: "Add to what I have given" }).click();
  await expect(plan.getByRole("listitem")).toHaveCount(3);
  await expect(plan.getByRole("listitem").first()).toContainText("Nov");
  await expect(plan).toContainText("US$125 a month");
});

test("zakat whose day has passed is owed now, not spread over months", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-02-18T10:00:00"));
  await page.goto("/shop");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-business").fill("20000");
  await page.evaluate(() => localStorage.setItem("mizan-my-v1", JSON.stringify({ zakatDay: { month: 9, day: 1 } })));
  await page.goto("/my");
  await expect(page.getByRole("region", { name: "What to do next" }).getByRole("link").first()).toContainText(
    "Your zakat day was 10 days ago: give what is left now",
  );
  const given = page.getByRole("region", { name: "What you have given" });
  await expect(given).toContainText("what is left is owed now");
  await expect(given.getByRole("region", { name: /Too much at once/ })).toHaveCount(0);
});

test("once there is a zakat day, My zakat offers a place on the home screen", async ({ page }) => {
  await page.goto("/my#zakat-day");
  await expect(page.getByRole("region", { name: "On your home screen" })).toHaveCount(0);
  await page.getByRole("button", { name: "1 Ramadan" }).click();
  const hint = page.getByRole("region", { name: "On your home screen" });
  await expect(hint).toContainText("Add to Home Screen");
  await hint.getByRole("button", { name: "Dismiss" }).click();
  await expect(hint).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Your zakat day" })).toBeVisible();
  await expect(page.getByRole("region", { name: "On your home screen" })).toHaveCount(0);
});

test("everything moves to a new phone with a code, once, without an account", async ({ page, browser }) => {
  await page.goto("/shop");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-business").fill("20000");
  await page.goto("/my#zakat-day");
  await page.getByRole("button", { name: "1 Ramadan" }).click();
  await page.locator("#my-amount").fill("125");
  await page.locator("#my-to").fill("Masjid al-Noor");
  await page.getByRole("button", { name: "Add to what I have given" }).click();

  // The old phone: a code and a picture to scan.
  const move = page.getByRole("region", { name: "Getting a new phone?" });
  await move.getByRole("button", { name: "Move to a new phone" }).click();
  const shown = move.getByRole("status");
  await expect(shown).toContainText("Works once");
  const code = (await shown.locator(".font-mono").innerText()).trim();
  expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  await expect(shown.getByRole("img", { name: /A picture to scan/ })).toBeVisible();

  // The new phone, scanning the picture: one tap brings it all.
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto(new URL(`/my?move=${code.replace("-", "")}`, page.url()).toString());
  const arrive = other.getByRole("region", { name: "From your old phone" });
  await arrive.getByRole("button", { name: "Bring it here" }).click();
  await expect(other.getByText("Brought over. Everything from your old phone is here.")).toBeVisible();
  await expect(other.getByRole("region", { name: "Your zakat day" })).toContainText("1 Ramadan");
  await expect(other.getByRole("region", { name: "What you have given" })).toContainText("Masjid al-Noor");
  expect(new URL(other.url()).search).toBe("");
  await fresh.close();

  // A third phone typing the same code: it has been used.
  const third = await browser.newContext();
  const late = await third.newPage();
  await late.goto(new URL("/my", page.url()).toString());
  await late.getByRole("button", { name: "Bring everything over with a code" }).click();
  await late.getByLabel("The code from your old phone").fill(code.toLowerCase());
  await late.getByRole("button", { name: "Bring it here" }).click();
  await expect(late.getByRole("region", { name: "From your old phone" }).getByRole("alert")).toContainText("already used");
  await third.close();
});

test("the Menu leads to moving phones: bringing it over on a new phone, sending it from an old one", async ({ page }) => {
  await page.goto("/sadaqah");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Move to a new phone" }).click();
  await page.waitForURL("**/my#move");
  // Nothing kept here yet: this is the new phone.
  await expect(page.getByRole("region", { name: "From your old phone" }).getByLabel("The code from your old phone")).toBeVisible();

  await page.evaluate(() => localStorage.setItem("mizan-my-v1", JSON.stringify({ zakatDay: { month: 9, day: 1 } })));
  await page.goto("/sadaqah");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Move to a new phone" }).click();
  await page.waitForURL("**/my#move");
  await expect(page.getByRole("region", { name: "Getting a new phone?" })).toBeInViewport();
});

test("a phone with nothing kept is not asked to keep it safe", async ({ page }) => {
  await page.goto("/my");
  // A first visit shows the to-do list, not cards that would repeat it.
  await expect(page.getByRole("region", { name: "What to do next" })).toBeVisible();
  await expect(page.getByRole("region", { name: "This year’s zakat" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Choose your zakat day" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Keep it safe" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "restore a saved copy" })).toBeVisible();
});

test("this year's figures can be sent to family or the imam to check", async ({ page }) => {
  await page.goto("/shop");
  await page.locator("#tool-currency").selectOption("USD");
  await page.locator("#shop-business").fill("20000");
  await page.goto("/my#zakat-day");
  await page.getByRole("button", { name: "1 Ramadan" }).click();
  const year = page.getByRole("region", { name: "This year’s zakat" });
  const send = year.getByRole("link", { name: "Send to family or the imam" });
  const text = new URL((await send.getAttribute("href"))!).searchParams.get("text")!;
  expect(text).toContain("My zakat for 1448 AH");
  expect(text).toContain("Zakat day: 1 Ramadan");
  expect(text).toContain("Zakat: US$500");
  expect(text).toContain("What I counted:");
  expect(text).toMatch(/\/my$/);
});
