import { test, expect, type Page } from "@playwright/test";
import { base32Decode, hotp, totpStep } from "../src/lib/totp";
import { PASSWORD, daysAgo, linkInEmail, registerAndSetUp, uniqueEmail } from "./helpers";

// Codes are computed here exactly as an authenticator app would. Each code
// can be used once, so later steps take the next 30-second window, which
// the server accepts for clock drift.

/** An authenticator that never offers a code from a window already used. */
function authenticator(secret: string) {
  let lastStep = 0;
  return {
    get lastStep() {
      return lastStep;
    },
    codeAt(step: number) {
      return hotp(base32Decode(secret), step);
    },
    /** The next code the server will accept, waiting for a new window if needed. */
    async next(page: Page): Promise<string> {
      const target = Math.max(totpStep(), lastStep + 1);
      while (target > totpStep() + 1) await page.waitForTimeout(1000);
      lastStep = target;
      return hotp(base32Decode(secret), target);
    },
  };
}

async function signIn(page: Page, email: string, password: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
}

test("two-step sign-in: set up, required at sign-in, not skipped by email, off by recovery code", async ({
  page,
}) => {
  const email = uniqueEmail("totp");
  await registerAndSetUp(page, { email, hawlStart: daysAgo(40), amount: "5000" });

  let app = authenticator("");
  await test.step("set up with an authenticator app", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Set up two-step sign-in" }).click();
    await expect(page.getByRole("img", { name: "QR code for your authenticator app" })).toBeVisible();
    const link = await page.getByRole("link", { name: "Open it in your app" }).getAttribute("href");
    expect(link).toMatch(/^otpauth:\/\/totp\/Mizan%3A/);
    const secret = (await page.locator("p.select-all.font-mono").first().textContent())!.replace(
      /\s/g,
      "",
    );
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    app = authenticator(secret);

    const right = await app.next(page);
    await page.fill("#totp-confirm-password", PASSWORD);
    await page.fill("#totp-confirm", right === "000000" ? "111111" : "000000");
    await page.getByRole("button", { name: "Turn on", exact: true }).click();
    await expect(page.getByText("That code is not right")).toBeVisible();
    await page.fill("#totp-confirm", right);
    await page.getByRole("button", { name: "Turn on", exact: true }).click();
    await expect(page.getByText("Two-step sign-in is on.")).toBeVisible();
  });

  await test.step("the password alone no longer signs in", async () => {
    await signIn(page, email, PASSWORD);
    await expect(page.getByLabel("Code from your authenticator app")).toBeVisible();
    expect((await page.request.get("/api/settings")).status()).toBe(401);

    // The code just used to turn it on cannot be used again.
    await page.fill("#code", app.codeAt(app.lastStep));
    await page.click("button[type=submit]");
    await expect(page.getByText("That code is not right")).toBeVisible();

    await page.fill("#code", await app.next(page));
    await page.click("button[type=submit]");
    await page.waitForURL(/\/dashboard/);
  });

  await test.step("an emailed reset link changes the password but still asks for the code", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Send a confirmation link" }).click();
    await expect(page.getByText("Sent. Open the link")).toBeVisible();
    await page.goto(linkInEmail(email, "Confirm your email for Mizan")!);
    await expect(page.getByText("Your email is confirmed.")).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/forgot");
    await page.fill("#link-email", email);
    await page.getByRole("button", { name: "Email me a link" }).click();
    await expect.poll(() => linkInEmail(email, "Reset your Mizan password")).toBeTruthy();
    await page.goto(linkInEmail(email, "Reset your Mizan password")!);
    await page.fill("#newPassword", "reset-by-email-pass");
    await page.fill("#confirmPassword", "reset-by-email-pass");
    await page.getByRole("button", { name: "Set new password" }).click();
    await page.waitForURL("**/login?reset=1");
    await expect(page.getByText("Password changed.")).toBeVisible();
    expect((await page.request.get("/api/settings")).status()).toBe(401);
  });

  await test.step("a recovery code gets back in and turns two-step off", async () => {
    await signIn(page, email, "reset-by-email-pass");
    await page.fill("#code", await app.next(page));
    await page.click("button[type=submit]");
    await page.waitForURL(/\/dashboard/);

    await page.goto("/settings");
    await page.click("text=Make a recovery code");
    await page.fill("#recoveryPassword", "reset-by-email-pass");
    await page.click("button:has-text('Make code')");
    const code = (await page.locator("p.select-all.font-mono").last().textContent())!.trim();

    await page.context().clearCookies();
    await page.goto("/forgot");
    await page.fill("#email", email);
    await page.fill("#code", code);
    await page.fill("#newPassword", "after-recovery-pass");
    await page.fill("#confirmPassword", "after-recovery-pass");
    await page.click("button:has-text('Reset password')");
    await page.waitForURL("**/settings?recovered=2fa");
    await expect(page.getByText("Two-step sign-in is off; set it up again")).toBeVisible();

    await signIn(page, email, "after-recovery-pass");
    await page.waitForURL(/\/dashboard/);
  });
});
