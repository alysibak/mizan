import { test, expect } from "@playwright/test";
import {
  PASSWORD,
  asNewVisitor,
  daysAgo,
  expectNoHorizontalScroll,
  registerAndSetUp,
  uniqueEmail,
  watchConsole,
} from "./helpers";

// One account walks the whole year: setup, give, weigh metal, close the year,
// back up, and close the account. Steps share state, so they run in order.
test("a full zakat year on a phone", async ({ page }) => {
  const errors = watchConsole(page);
  page.on("dialog", (d) => d.accept());
  const email = uniqueEmail("year");
  // Today's prices, as the price sources would give them.
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "CAD", goldPricePerGram: 120, silverPricePerGram: 1.5, source: "test" } }),
  );

  await test.step("setup looks up today's prices, and refuses the starter ones", async () => {
    await asNewVisitor(page);
    await page.goto("/register");
    await page.fill("#name", "Gate Test");
    await page.fill("#email", uniqueEmail("gate"));
    await page.fill("#password", PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForURL("**/begin");
    await page.click("#change-currency");
    await page.selectOption("#currency", "CAD");
    // Nobody is asked a price they cannot know: it is filled in.
    await expect(page.getByText("Today’s prices: gold $120, silver $1.50 a gram")).toBeVisible();
    await page.click("#change-prices");
    await expect(page.locator("#gold")).toHaveValue("120");
    await expect(page.locator("#silver")).toHaveValue("1.5");
    await page.fill("#gold", "90");
    await page.fill("#silver", "1.05");
    await page.click("button:has-text('Continue')");
    await expect(page.getByText("Enter today’s gold and silver prices for a gram")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL((u) => u.pathname === "/");
  });

  await test.step("setup with real prices lands on a payable dashboard", async () => {
    await registerAndSetUp(page, { email, hawlStart: daysAgo(400), amount: "12345.67" });
    await expectNoHorizontalScroll(page);
  });

  await test.step("the pay button prefills an amount the form accepts", async () => {
    const cta = page.locator("a", { hasText: /I gave .*zakat/ }).first();
    await expect(cta).toContainText("308.64");
    await cta.click();
    await page.waitForURL("**/giving?**");
    await expect(page.locator("#amount")).toHaveValue("308.64");
    await expect(page.locator("#date")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    expect(await page.$eval("form", (f) => (f as HTMLFormElement).checkValidity())).toBe(true);
    await page.click("button:has-text('Save it')");
    await expect(page.getByText("That covers all of this year’s zakat")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByText("You have given all of this year’s zakat.")).toBeVisible();
  });

  await test.step("metal by weight follows the gold price", async () => {
    await page.goto("/assets");
    await page.getByRole("button", { name: "Gold coins and bars", exact: true }).click();
    await page.fill("#asset-new-label", "Bangles");
    await page.check("text=Value by weight");
    await page.fill("#asset-new-grams", "10");
    await page.fill("#asset-new-purity", "0.916");
    await page.click("button:has-text('Add it')");
    await expect(page.locator("li", { hasText: "Bangles" })).toContainText("1,099.20");
    await expectNoHorizontalScroll(page);

    await page.goto("/settings#metal-prices");
    await page.fill("#goldPricePerGram", "130");
    await page.click("button:has-text('Save prices')");
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.goto("/assets");
    await expect(page.locator("li", { hasText: "Bangles" })).toContainText("1,190.80");
  });

  await test.step("a holding in another currency converts at the user's rate", async () => {
    await page.getByRole("button", { name: "Money in the bank", exact: true }).click();
    await page.fill("#asset-new-label", "US account");
    await page.check("text=Held in another currency");
    await page.fill("#asset-new-fcur", "USD");
    await page.fill("#asset-new-famount", "1000");
    await page.fill("#asset-new-rate", "1.3725");
    await page.click("button:has-text('Add it')");
    const row = page.locator("li", { hasText: "US account" });
    await expect(row).toContainText("1,372.50");
    await expect(row).toContainText("@ 1.3725");
  });

  await test.step("editing a category resets its zakatable portion", async () => {
    await page.getByRole("button", { name: /^Chequing.*Edit$/ }).click();
    // The open row's own form, not the add form below it.
    await page.locator("select[id$='-category']:not([id^='asset-new'])").selectOption("stocks_longterm");
    await expect(page.locator("input[id$='-portion']:not([id^='asset-new'])")).toHaveValue("0.25");
    await page.click("button:has-text('Cancel')");
  });

  await test.step("closing the year keeps a copy and starts the next year at zero", async () => {
    await page.goto("/year");
    await page.click("button:has-text('Close this year')");
    await page.click("button:has-text('Close the year')");
    await page.waitForURL("**/year?rolled=**");
    await expect(page.getByText("Your next zakat year starts")).toBeVisible();

    await expect(page.locator(".ledger-row", { hasText: "Given so far" })).toContainText("$0");

    // The copy is kept, and the year it closed cannot be closed twice.
    const snapshot = await page.locator('a[href^="/year/snapshots/"]').first().getAttribute("href");
    await page.goto(snapshot!);
    await expect(page.locator("button:has-text('Start next year’s count on')")).toHaveCount(0);
    const status = await page.evaluate(
      async () => (await fetch("/api/settings/roll-hawl", { method: "POST" })).status,
    );
    expect(status).toBe(409);
    await page.goto("/statement");
    await expectNoHorizontalScroll(page);
  });

  await test.step("backups round-trip and damaged ones change nothing", async () => {
    const backup = await page.evaluate(async () => (await fetch("/api/export")).json());
    expect(backup.version).toBe(3);
    expect(backup.assets.some((a: { grams: number }) => a.grams === 10)).toBe(true);
    expect(backup.assets.some((a: { foreignCurrency: string }) => a.foreignCurrency === "USD")).toBe(true);

    const restored = await page.evaluate(async (b) => {
      const r = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      return { status: r.status, body: await r.json() };
    }, backup);
    expect(restored).toMatchObject({ status: 200, body: { assets: 3, snapshots: 1 } });

    const damaged = await page.evaluate(async (b) => {
      const broken = { ...b, snapshots: [{ ...b.snapshots[0], payload: '{"version":1}' }] };
      const r = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broken),
      });
      return { status: r.status, assets: (await (await fetch("/api/assets")).json()).length };
    }, backup);
    expect(damaged).toEqual({ status: 400, assets: 3 });

    const csv = await page.evaluate(async () => (await fetch("/api/export/giving")).text());
    expect(csv).toContain("Zakat,,308.64,CAD");
  });

  await test.step("calendar reminders publish the due day only", async () => {
    await page.goto("/settings#reminders");
    await page.click("text=Turn on calendar reminders");
    const url = await page.locator("p.font-mono").first().textContent();
    expect(url).toMatch(/\/api\/calendar\/[A-Za-z0-9_-]+\.ics$/);
    const ics = await page.evaluate(async (u) => (await fetch(u!)).text(), url);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).not.toMatch(/308|\$/);
  });

  await test.step("a recovery code resets a forgotten password once", async () => {
    await page.goto("/settings#account");
    await page.click("text=Make a recovery code");
    await page.fill("#recoveryPassword", PASSWORD);
    await page.click("button:has-text('Make code')");
    // Wait for the code itself: the calendar address above is in the same style.
    const shown = page.locator("p.select-all.font-mono", { hasText: /^[A-Z0-9]{5}-/ });
    await expect(shown).toBeVisible();
    const code = (await shown.textContent())!.trim();
    expect(code).toMatch(/^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/);

    await page.getByRole("button", { name: "Sign out", exact: true }).locator("visible=true").first().click();
    await page.waitForURL((u) => u.pathname === "/");
    await page.goto("/forgot");
    await page.fill("#email", email);
    await page.fill("#code", code.toLowerCase());
    await page.fill("#newPassword", "brand-new-password");
    await page.fill("#confirmPassword", "brand-new-password");
    await page.click("button:has-text('Reset password')");
    await page.waitForURL("**/settings?recovered=1");
    await expect(page.getByText("recovery code is used up")).toBeVisible();

    const reuse = await page.evaluate(async ([e, c]) => {
      const r = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, code: c, newPassword: "yet-another-pass" }),
      });
      return r.status;
    }, [email, code]);
    expect(reuse).toBe(401);
  });

  await test.step("sign-in ignores an off-site next link", async () => {
    await page.getByRole("button", { name: "Sign out", exact: true }).locator("visible=true").first().click();
    await page.waitForURL((u) => u.pathname === "/");
    await page.goto(`/login?next=${encodeURIComponent("https://example.com/phish")}`);
    await page.fill("#email", email);
    await page.fill("#password", "brand-new-password");
    await page.click("button[type=submit]");
    await page.waitForURL(/\/dashboard/);
    expect(new URL(page.url()).host).toBe(new URL(page.url()).host);
    expect(page.url()).not.toContain("example.com");
  });

  await test.step("Zakat al-Fitr is noted as its own type", async () => {
    await page.goto("/giving?type=fitr&amount=60");
    await expect(page.locator("#type")).toHaveValue("fitr");
    expect(Number(await page.inputValue("#amount"))).toBe(60);
  });

  await test.step("deleting the account removes it", async () => {
    await page.goto("/settings#account");
    await page.click("text=Delete my account…");
    await page.fill("#deletePassword", "brand-new-password");
    await page.fill("#deleteConfirm", "DELETE");
    await page.click("button:has-text('Delete everything')");
    await page.waitForURL((u) => u.pathname === "/");
    const status = await page.evaluate(async (e) => {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password: "brand-new-password" }),
      });
      return r.status;
    }, email);
    expect(status).toBe(401);
  });

  expect(errors).toEqual([]);
});
