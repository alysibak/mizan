import { expect, test } from "@playwright/test";
import { asNewVisitor, asSecondAdmin } from "./helpers";

test("anyone can report a problem from the Menu, in their language, and the admin reads it", async ({ page }) => {
  await asNewVisitor(page);
  await page.goto("/ur/guide");
  await page.getByRole("button", { name: "مینو" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "مسئلہ بتائیں" }).click();
  await expect(page).toHaveURL(/\/ur\/report\?from=%2Fur%2Fguide$/);
  await expect(page.getByText("/ur/guide")).toBeVisible();
  await page.getByLabel("سمجھنا مشکل ہے").check();
  await page.fill("#problem-note", "سونے والا قدم سمجھ نہیں آیا");
  await page.getByRole("button", { name: "بھیجیں" }).click();
  await expect(page.getByText("شکریہ۔ ہم اسے دیکھیں گے۔")).toBeVisible();

  // The operator sees it, with where it happened and its language.
  const admin = await (await page.context().browser()!.newContext()).newPage();
  await asSecondAdmin(admin);
  await admin.goto("/admin/feedback");
  const item = admin.getByRole("listitem").filter({ hasText: "سونے والا قدم سمجھ نہیں آیا" });
  await expect(item).toContainText("Hard to understand");
  await expect(item).toContainText("/ur/guide");
  await expect(item).toContainText("اردو");
  await item.getByRole("button", { name: "Done" }).click();
  await expect(admin.getByRole("listitem").filter({ hasText: "سونے والا قدم" })).toContainText("done");
});
