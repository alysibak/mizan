import { expect, type Page } from "@playwright/test";

export const PASSWORD = "correct-horse-battery";

export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

export function uniqueEmail(tag: string): string {
  return `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Register and finish setup with real prices, a hawl, and one holding. */
export async function registerAndSetUp(
  page: Page,
  opts: { email: string; hawlStart: string; amount: string; gold?: string; silver?: string },
) {
  await page.goto("/register");
  await page.fill("#name", "Amina Test");
  await page.fill("#email", opts.email);
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/begin");

  await page.click("text=I understand — continue");
  await page.click("button:has-text('Continue')");
  await page.waitForSelector("#gold");
  await page.fill("#gold", opts.gold ?? "120");
  await page.fill("#silver", opts.silver ?? "1.5");
  await page.click("button:has-text('Continue')");
  await page.fill("#hawl", opts.hawlStart);
  await page.click("button:has-text('Continue')");
  await page.fill("#alabel", "Chequing");
  await page.fill("#aamount", opts.amount);
  await page.click("text=Add and finish");
  await page.waitForURL(/\/dashboard/);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Console errors other than expected 4xx responses from deliberate checks. */
export function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/Failed to load resource: the server responded with a status of 4\d\d/.test(m.text())) return;
    errors.push(`${page.url()} :: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`${page.url()} :: ${e.message}`));
  return errors;
}

/** Every id on the page is unique, so each label points at one control. */
export async function expectUniqueIds(page: Page) {
  const dupes = await page.evaluate(() => {
    const seen = new Map<string, number>();
    for (const el of document.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
    return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  });
  expect(dupes).toEqual([]);
}
