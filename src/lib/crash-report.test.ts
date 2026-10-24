import { describe, expect, it } from "vitest";
import { crashNote, worthReporting } from "./crash-report";

describe("crash reports", () => {
  it("leave out noise that is not Mizan's", () => {
    const origin = "https://mizan.example";
    expect(worthReporting("Script error.", undefined, origin)).toBe(false);
    expect(worthReporting("ResizeObserver loop completed with undelivered notifications.", undefined, origin)).toBe(false);
    expect(worthReporting("x is undefined", "chrome-extension://abc/content.js", origin)).toBe(false);
    expect(worthReporting("x is undefined", "https://mizan.example/_next/static/chunks/1.js", origin)).toBe(true);
    expect(worthReporting("x is undefined", undefined, origin)).toBe(true);
  });

  it("say where, without the site or query strings, and stay short", () => {
    expect(crashNote("TypeError: x is undefined", "https://mizan.example/_next/static/chunks/1.js?v=2", 4, 56)).toBe(
      "TypeError: x is undefined (at /_next/static/chunks/1.js:4:56)",
    );
    expect(crashNote("y".repeat(2000)).length).toBeLessThanOrEqual(600);
  });
});
