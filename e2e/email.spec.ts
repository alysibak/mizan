import { test, expect } from "@playwright/test";
import {
  CRON_SECRET,
  daysAgo,
  emailsTo,
  linkInEmail,
  registerAndSetUp,
  uniqueEmail,
} from "./helpers";

// The test server sends email to a file (see playwright.config.ts), so each
// link can be followed the way a person would from their inbox.

test("confirm an address, get a hawl reminder once, and reset a password by link", async ({
  page,
  request,
}) => {
  const email = uniqueEmail("mail");
  // A lunar year is about 354 days, so this hawl ends in about four days.
  await registerAndSetUp(page, { email, hawlStart: daysAgo(350), amount: "20000" });

  await test.step("confirm the address", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Send a confirmation link" }).click();
    await expect(page.getByText("Sent. Open the link")).toBeVisible();
    const link = linkInEmail(email, "Confirm your email for Mizan");
    expect(link).toContain("http://localhost:3210/api/auth/verify-email?token=");
    await page.goto(link!);
    await expect(page.getByText("Your email is confirmed.")).toBeVisible();
    await page.goto(link!);
    await expect(page.getByText("expired or was already used")).toBeVisible();
  });

  await test.step("a reminder goes out once, a week ahead", async () => {
    const toggle = page.getByRole("checkbox", { name: /Email me a week before my hawl day/ });
    await toggle.check();
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeEnabled();

    expect((await request.get("/api/cron/reminders")).status()).toBe(404);
    const wrong = await request.get("/api/cron/reminders", {
      headers: { authorization: "Bearer nope" },
    });
    expect(wrong.status()).toBe(404);

    const auth = { headers: { authorization: `Bearer ${CRON_SECRET}` } };
    expect((await request.get("/api/cron/reminders", auth)).ok()).toBe(true);
    const reminders = () =>
      emailsTo(email).filter((m) => m.subject === "Your zakat year closes in a week");
    expect(reminders()).toHaveLength(1);
    expect(reminders()[0].text).toContain("http://localhost:3210/year");
    expect(reminders()[0].text).not.toMatch(/20,?000/);

    await request.get("/api/cron/reminders", auth);
    expect(reminders()).toHaveLength(1);
  });

  await test.step("reset the password from an emailed link", async () => {
    await page.context().clearCookies();
    await page.goto("/forgot");
    await page.fill("#link-email", email);
    await page.getByRole("button", { name: "Email me a link" }).click();
    await expect(page.getByText("a link is on its way")).toBeVisible();

    // The email is sent just after the response.
    await expect.poll(() => linkInEmail(email, "Reset your Mizan password")).toBeTruthy();
    const link = linkInEmail(email, "Reset your Mizan password")!;
    expect(link).toContain("http://localhost:3210/reset?token=");

    await page.goto(link);
    await page.fill("#newPassword", "a-brand-new-password");
    await page.fill("#confirmPassword", "a-brand-new-password");
    await page.getByRole("button", { name: "Set new password" }).click();
    await page.waitForURL(/\/dashboard/);

    await page.context().clearCookies();
    await page.goto(link);
    await expect(page.getByText("This link has expired or was already used.")).toBeVisible();

    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", "a-brand-new-password");
    await page.click("button[type=submit]");
    await page.waitForURL(/\/dashboard/);
  });
});

test("reset requests look the same for unknown and unconfirmed addresses", async ({
  page,
  request,
}) => {
  const unknown = uniqueEmail("nobody");
  const res = await request.post("/api/auth/reset-request", {
    data: { email: unknown },
    headers: { "x-forwarded-for": "10.9.9.9" },
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });

  // An account whose address was never confirmed gets no link either: a typo
  // at sign-up must not hand the account to whoever owns that address.
  const unconfirmed = uniqueEmail("unconfirmed");
  await registerAndSetUp(page, { email: unconfirmed, hawlStart: daysAgo(30), amount: "100" });
  const again = await request.post("/api/auth/reset-request", {
    data: { email: unconfirmed },
    headers: { "x-forwarded-for": "10.9.9.10" },
  });
  expect(await again.json()).toEqual({ ok: true });
  await page.waitForTimeout(500);
  expect(emailsTo(unknown)).toHaveLength(0);
  expect(emailsTo(unconfirmed)).toHaveLength(0);
});
