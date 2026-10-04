import { describe, it, expect } from "vitest";
import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("keeps same-origin paths with their query and hash", () => {
    expect(safeNextPath("/year")).toBe("/year");
    expect(safeNextPath("/giving?type=zakat&amount=12.50#form")).toBe(
      "/giving?type=zakat&amount=12.50#form",
    );
  });

  it("falls back for anything that could leave the site", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example",
      "javascript:alert(1)",
      "evil.example",
      "",
      null,
      undefined,
    ]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
});
