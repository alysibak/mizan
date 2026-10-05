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

// One account walks the whole year: setup, pay, weigh metal, freeze, roll,
// back up, and close the account. Steps share state, so they run in order.
test("a full zakat year on a phone", async ({ page }) => {
  const errors = watchConsole(page);
  page.on("dialog", (d) => d.accept());
  const email = uniqueEmail("year");

  await test.step("setup refuses the starter metal prices", async () => {
    await asNewVisitor(page);
    await page.goto("/register");
    await page.fill("#name", "Gate Test");
    await page.fill("#email", uniqueEmail("gate"));
    await page.fill("#password", PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForURL("**/begin");
    await page.click("text=I understand — continue");
    await page.click("button:has-text('Continue')");
    await expect(page.locator("#gold")).toHaveValue("");
    await page.fill("#gold", "90");
    await page.fill("#silver", "1.05");
    await page.click("button:has-text('Continue')");
    await expect(page.getByText("Enter today’s prices per gram")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL((u) => u.pathname === "/");
  });

  await test.step("setup with real prices lands on a payable dashboard", async () => {
    await registerAndSetUp(page, { email, hawlStart: daysAgo(400), amount: "12345.67" });
    await expectNoHorizontalScroll(page);
  });

  await test.step("the pay button prefills an amount the form accepts", async () => {
    const cta = page.locator("a", { hasText: /Record .*zakat/ }).first();
    await expect(cta).toContainText("308.64");
    await cta.click();
    await page.waitForURL("**/giving?**");
    await expect(page.locator("#amount")).toHaveValue("308.64");
    await expect(page.locator("#date")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    expect(await page.$eval("form", (f) => (f as HTMLFormElement).checkValidity())).toBe(true);
    await page.click("button:has-text('Record gift')");
    await expect(page.getByText("Cycle cleared")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByText("Cycle met")).toBeVisible();
  });

  await test.step("metal by weight follows the gold price", async () => {
    await page.goto("/assets");
    await page.selectOption("#asset-new-category", "gold");
    await page.fill("#asset-new-label", "Bangles");
    await page.check("text=Value by weight");
    await page.fill("#asset-new-grams", "10");
    await page.fill("#asset-new-purity", "0.916");
    await page.click("button:has-text('Add asset')");
    await expect(page.locator("li", { hasText: "Bangles" })).toContainText("1,099.20");
    await expectNoHorizontalScroll(page);

    await page.goto("/settings");
    await page.fill("#goldPricePerGram", "130");
    await page.click("button:has-text('Save settings')");
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.goto("/assets");
    await expect(page.locator("li", { hasText: "Bangles" })).toContainText("1,190.80");
  });

  await test.step("a holding in another currency converts at the user's rate", async () => {
    await page.selectOption("#asset-new-category", "bank");
    await page.fill("#asset-new-label", "US account");
    await page.check("text=Held in another currency");
    await page.fill("#asset-new-fcur", "USD");
    await page.fill("#asset-new-famount", "1000");
    await page.fill("#asset-new-rate", "1.3725");
    await page.click("button:has-text('Add asset')");
    const row = page.locator("li", { hasText: "US account" });
    await expect(row).toContainText("1,372.50");
    await expect(row).toContainText("@ 1.3725");
  });

  await test.step("editing a category resets its zakatable portion", async () => {
    await page.click("button[aria-label='Edit Chequing']");
    await page.locator("select[id$='-category']").last().selectOption("stocks_longterm");
    await expect(page.locator("input[id$='-portion']").last()).toHaveValue("0.25");
    await page.click("button:has-text('Cancel')");
  });

  await test.step("freeze, roll, and the next cycle starts at zero", async () => {
    await page.goto("/year");
    await page.click("button:has-text('Freeze this year')");
    await page.click("button:has-text('Freeze')");
    await page.waitForURL("**/year/snapshots/**");
    const snapshot = page.url();
    await page.click("button:has-text('Roll hawl to')");
    await page.waitForURL("**/year?rolled=**");
    await expect(page.getByText("Next hawl starts")).toBeVisible();

    await expect(page.locator(".ledger-row", { hasText: "Paid ·" })).toContainText("$0.00");

    await page.goto(snapshot);
    await expect(page.locator("button:has-text('Roll hawl to')")).toHaveCount(0);
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
    await page.goto("/settings");
    await page.click("text=Turn on calendar reminders");
    const url = await page.locator("p.font-mono").first().textContent();
    expect(url).toMatch(/\/api\/calendar\/[A-Za-z0-9_-]+\.ics$/);
    const ics = await page.evaluate(async (u) => (await fetch(u!)).text(), url);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).not.toMatch(/308|\$/);
  });

  await test.step("a recovery code resets a forgotten password once", async () => {
    await page.goto("/settings");
    await page.click("text=Make a recovery code");
    await page.fill("#recoveryPassword", PASSWORD);
    await page.click("button:has-text('Make code')");
    const code = (await page.locator("p.select-all.font-mono").last().textContent())!.trim();
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

  await test.step("Zakat al-Fitr records as its own type", async () => {
    await page.goto("/tools/fitr");
    await page.fill("#people", "4");
    await page.fill("#perPerson", "15");
    await page.click("text=Record on Give");
    await page.waitForURL("**/giving?**");
    await expect(page.locator("#type")).toHaveValue("fitr");
    expect(Number(await page.inputValue("#amount"))).toBe(60);
  });

  await test.step("deleting the account removes it", async () => {
    await page.goto("/settings");
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
