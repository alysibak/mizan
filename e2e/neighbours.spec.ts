import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  asNewVisitor,
  asSecondAdmin,
  emailsTo,
  expectNoHorizontalScroll,
  registerOnly,
  uniqueEmail,
  watchConsole,
} from "./helpers";

async function freshPage(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await asNewVisitor(page);
  return page;
}

test("a mosque lists a checked need, a visitor promises and pays, and hears it arrived", async ({ browser }) => {
  test.setTimeout(180_000);
  const leadEmail = uniqueEmail("lead");
  const memberEmail = uniqueEmail("member");
  const giverEmail = uniqueEmail("giver");

  // The two people who will run the mosque's desk make accounts.
  const lead = await freshPage(browser);
  await registerOnly(lead, leadEmail, "Imam Yusuf");
  const member = await freshPage(browser);
  await registerOnly(member, memberEmail, "Sister Hafsa");

  // The operator adds the mosque, with its lead.
  const admin = await freshPage(browser);
  await asSecondAdmin(admin);
  await admin.goto("/admin/partners");
  await admin.fill("#ap-name", "Masjid Al-Test");
  await admin.fill("#ap-city", "Testville");
  await admin.selectOption("#ap-currency", "CAD");
  await admin.fill("#ap-lead", leadEmail);
  await admin.getByRole("button", { name: "Add it" }).click();
  await expect(admin.getByRole("link", { name: "Masjid Al-Test" })).toBeVisible();

  // The lead sets up the page, adds a second person, and writes a need.
  await lead.goto("/partner");
  await expect(lead.getByRole("heading", { name: "Masjid Al-Test" })).toBeVisible();
  await lead.getByText("Your mosque’s page and people").click();
  await lead.fill("#p-give", "Bank transfer to Masjid Al-Test, account 12-345. Put your code as the reference.");
  await lead.fill("#p-about", "Our committee meets each family and sees their papers.");
  await lead.getByRole("button", { name: "Save", exact: true }).click();
  await expect(lead.getByText("Saved.")).toBeVisible();
  await lead.fill("#p-add", memberEmail);
  await lead.getByRole("button", { name: "Add", exact: true }).click();
  await expect(lead.getByText(memberEmail)).toBeVisible();

  await lead.getByRole("button", { name: "Write a new need" }).click();
  await lead.getByRole("button", { name: "Rent", exact: true }).click();
  await lead.fill("#new-title", "Rent for a family of four");
  // Nothing that could point to the family gets through.
  await lead.fill("#new-story", "Call the mother on 0300 1234567");
  await lead.fill("#new-amount", "1000");
  await lead.getByLabel("Yes, zakat can go here").check();
  await lead.getByRole("button", { name: "Save it" }).click();
  await expect(lead.getByText(/Take out the phone/)).toBeVisible();
  await lead.fill("#new-story", "Two months behind since the father lost his job.");
  await lead.getByRole("button", { name: "Save it" }).click();
  const leadNeed = lead.locator("[data-need='Rent for a family of four']");
  await expect(leadNeed).toContainText("Waiting for a check");
  // The one who wrote it cannot list it alone.
  await leadNeed.getByRole("button", { name: "Check it and list it" }).click();
  await expect(lead.getByText(/Someone other than the person who wrote it/)).toBeVisible();

  // The second person checks and lists it.
  await member.goto("/partner");
  await member.locator("[data-need='Rent for a family of four']").getByRole("button", { name: "Check it and list it" }).click();
  await expect(member.locator("[data-need='Rent for a family of four']")).toContainText("Listed");

  // A visitor finds it, with who checked it, and promises part of it.
  const giver = await freshPage(browser);
  const errors = watchConsole(giver);
  // Live prices are outside the test's control; the home page asks for them.
  await giver.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await giver.goto("/");
  // On the home page, and in the Menu.
  await expect(giver.getByRole("main").getByRole("link", { name: "Help a family near you" })).toBeVisible();
  await giver.getByRole("button", { name: "Menu" }).click();
  await giver.getByRole("dialog").getByRole("link", { name: "Help a family near you" }).click();
  await giver.waitForURL("**/neighbours");
  await expectNoHorizontalScroll(giver);
  const card = giver.getByRole("link", { name: /Rent for a family of four/ });
  await expect(card).toContainText("Checked by Masjid Al-Test");
  await expect(card).toContainText("Zakat can go here");
  await card.click();
  await expect(giver.getByRole("heading", { name: "Rent for a family of four" })).toBeVisible();
  // Never more than is still needed.
  await giver.fill("#pledge-amount", "1200");
  await giver.getByRole("button", { name: "I’ll give this" }).click();
  await expect(giver.getByText(/Only \$1,000 is still needed/)).toBeVisible();
  await giver.fill("#pledge-amount", "400");
  await giver.getByText("Add your name or a way to reach you").click();
  await giver.fill("#pledge-contact", giverEmail);
  await giver.getByRole("button", { name: "I’ll give this" }).click();
  await expect(giver.getByRole("heading", { name: "Thank you. Now pay Masjid Al-Test." })).toBeVisible();
  await expect(giver.getByText("Bank transfer to Masjid Al-Test")).toBeVisible();
  const code = (await giver.locator("p.font-mono").first().innerText()).trim();
  expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  // A copy for their own WhatsApp, so the code is not lost.
  await expect(giver.getByRole("link", { name: "Send it to my WhatsApp" })).toHaveAttribute(
    "href",
    new RegExp(`^https://wa\\.me/\\?text=.*${code}`),
  );
  await giver.getByRole("link", { name: "See what I promised" }).click();
  await expect(giver.getByText("Waiting for your payment")).toBeVisible();
  await expect(giver.getByText("Please pay within 7 days.")).toBeVisible();

  // The money arrives at the mosque, which marks it received.
  await lead.goto("/partner");
  const row = lead.locator(`[data-code='${code.replace("-", "")}']`);
  await expect(row).toContainText("Waiting for the money");
  await expect(row).toContainText(giverEmail);
  await row.getByRole("button", { name: "It arrived" }).click();
  await expect(lead.locator(`[data-code='${code.replace("-", "")}']`)).toContainText("Received $400");
  expect(emailsTo(giverEmail).at(-1)?.text).toContain("reached Masjid Al-Test");
  // What arrived, for the mosque's own accounts.
  const csv = await lead.request.get(
    (await lead.getByRole("link", { name: "Download what was received" }).getAttribute("href"))!,
  );
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain(`Rent for a family of four,zakat,${code},400.00,CAD`);

  // The giver hears it arrived, and counts it as zakat given.
  await giver.reload();
  await expect(giver.getByText("It arrived. May Allah reward you.")).toBeVisible();
  await giver.getByRole("button", { name: "Count it as zakat given" }).click();
  await expect(giver.getByText("Counted in My zakat")).toBeVisible();
  const kept = await giver.evaluate(() => JSON.parse(localStorage.getItem("mizan-my-v1") ?? "{}"));
  expect(kept.payments).toEqual([expect.objectContaining({ amount: 400, to: "Masjid Al-Test" })]);

  // A second giver promises the rest: it is fully promised, and no one can promise more.
  const second = await freshPage(browser);
  await second.goto("/neighbours");
  await second.getByRole("link", { name: /Rent for a family of four/ }).click();
  await second.getByRole("button", { name: /All of it/ }).click();
  await second.getByRole("button", { name: "I’ll give this" }).click();
  await expect(second.getByText("Thank you. Now pay")).toBeVisible();
  await second.goto("/neighbours");
  await expect(second.getByRole("link", { name: /Rent for a family of four/ })).toContainText("Fully promised");

  // The mosque's own page shows what it has passed on.
  await second.goto("/neighbours");
  await second.getByRole("link", { name: /Rent for a family of four/ }).click();
  await second.getByRole("link", { name: "Masjid Al-Test" }).click();
  await expect(second.getByText("Our committee meets each family")).toBeVisible();
  await expect(second.getByText("$400").first()).toBeVisible();
  await expect(second.getByText("Of this, $400 was zakat.")).toBeVisible();

  // Three reports take it off the list until the mosque looks.
  for (let i = 0; i < 3; i++) {
    const reporter = await freshPage(browser);
    await reporter.goto("/neighbours");
    await reporter.getByRole("link", { name: /Rent for a family of four/ }).click();
    await reporter.getByText("Something wrong with this?").click();
    await reporter.getByLabel("It could show who the family is").check();
    await reporter.getByRole("button", { name: "Send to the mosque" }).click();
    await expect(reporter.getByText("Thank you. The mosque will look at it.")).toBeVisible();
    await reporter.context().close();
  }
  await second.goto("/neighbours");
  await expect(second.getByRole("link", { name: /Rent for a family of four/ })).toHaveCount(0);

  await lead.goto("/partner");
  const paused = lead.locator("[data-need='Rent for a family of four']");
  await expect(paused).toContainText("Off the list");
  for (let i = 0; i < 3; i++) {
    await paused.getByRole("button", { name: "Nothing is wrong" }).first().click();
    await expect(paused.getByRole("button", { name: "Nothing is wrong" })).toHaveCount(2 - i);
  }
  await paused.getByRole("button", { name: "Put it back on the list" }).click();
  await second.goto("/neighbours");
  await expect(second.getByRole("link", { name: /Rent for a family of four/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the guide's answer and My zakat lead to a family near you", async ({ page }) => {
  await page.route("**/api/metals?*", (route) =>
    route.fulfill({ json: { currency: "USD", goldPricePerGram: 100, silverPricePerGram: 1.2, source: "test" } }),
  );
  await page.goto("/guide");
  await page.getByRole("button", { name: "Next" }).click();
  await page.fill("#guide-cash", "20000");
  const show = page.getByRole("button", { name: "Show my zakat" });
  while (!(await show.isVisible())) await page.getByRole("button", { name: "Next" }).click();
  await show.click();
  await page.getByRole("link", { name: /Give it to a family near you/ }).click();
  await expect(page).toHaveURL(/\/neighbours\?zakat=1$/);
  await expect(page.getByRole("heading", { name: "Help a family near you" })).toBeVisible();
});

test("a mosque desk is only for its people, and needs are never shown before they are checked", async ({ page }) => {
  await page.goto("/partner");
  await expect(page).toHaveURL(/\/login/);
  const res = await page.request.post("/api/neighbours/manage/needs", { data: { partnerId: "x", kind: "rent" } });
  expect(res.status()).toBe(401);
  const missing = await page.request.get("/api/neighbours/pledges/K7P4QX2M");
  expect(missing.status()).toBe(404);
  await page.goto("/neighbours/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "Nothing on this page" })).toBeVisible();
});
