import { afterEach, describe, expect, it, vi } from "vitest";
import { publicOrigin, siteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

function clear() {
  for (const k of ["APP_URL", "NEXT_PUBLIC_APP_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"]) {
    vi.stubEnv(k, "");
  }
}

describe("siteUrl", () => {
  it("prefers APP_URL", () => {
    clear();
    vi.stubEnv("APP_URL", "https://mizan.example");
    vi.stubEnv("VERCEL_URL", "preview-123.vercel.app");
    expect(siteUrl().origin).toBe("https://mizan.example");
  });

  it("falls back to the Vercel production domain, adding https", () => {
    clear();
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "mizan.vercel.app");
    expect(siteUrl().origin).toBe("https://mizan.vercel.app");
  });

  it("defaults to localhost and survives a malformed value", () => {
    clear();
    expect(siteUrl().origin).toBe("http://localhost:3000");
    vi.stubEnv("APP_URL", "not a url");
    expect(siteUrl().origin).toBe("http://localhost:3000");
  });
});

describe("publicOrigin", () => {
  it("uses the request's own origin unless APP_URL pins one", () => {
    clear();
    const req = new Request("http://10.0.0.5:3000/api/x");
    expect(publicOrigin(req)).toBe("http://10.0.0.5:3000");
    vi.stubEnv("APP_URL", "https://mizan.example");
    expect(publicOrigin(req)).toBe("https://mizan.example");
  });

  it("prefers the host the browser asked for over the bind address", () => {
    clear();
    const direct = new Request("http://0.0.0.0:3000/api/x", {
      headers: { host: "localhost:3000" },
    });
    expect(publicOrigin(direct)).toBe("http://localhost:3000");
    const proxied = new Request("http://0.0.0.0:3000/api/x", {
      headers: {
        host: "10.0.0.5:3000",
        "x-forwarded-host": "mizan.example, internal",
        "x-forwarded-proto": "https",
      },
    });
    expect(publicOrigin(proxied)).toBe("https://mizan.example");
  });
});
