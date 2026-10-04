import { test, expect } from "@playwright/test";

test("security headers and cross-site write refusal", async ({ request }) => {
  const res = await request.get("/login");
  const headers = res.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["strict-transport-security"]).toContain("max-age=");

  const crossSite = await request.post("/api/auth/login", {
    headers: { "Sec-Fetch-Site": "cross-site" },
    data: {},
  });
  expect(crossSite.status()).toBe(403);
});

test("installable: manifest, icons, service worker, offline page", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  for (const icon of ["/icons/icon-192.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png"]) {
    expect((await request.get(icon)).status()).toBe(200);
  }
  expect(await (await request.get("/offline")).text()).toContain("You are offline");

  await page.goto("/login");
  const active = await page.evaluate(async () => {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((r) => setTimeout(() => r(null), 10_000)),
    ]);
    return Boolean(reg && reg.active);
  });
  expect(active).toBe(true);
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("follows the system and keeps text readable", async ({ page }) => {
    await page.goto("/login");
    const colors = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const heading = getComputedStyle(document.querySelector("h1")!);
      return { bg: body.backgroundColor, text: heading.color };
    });
    expect(colors.bg).toBe("rgb(15, 26, 22)");
    expect(colors.text).toBe("rgb(231, 238, 234)");
  });
});
