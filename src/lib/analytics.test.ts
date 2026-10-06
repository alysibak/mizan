import { describe, expect, it } from "vitest";
import { isPublicPath } from "./analytics";

describe("isPublicPath", () => {
  it("counts public pages in every language", () => {
    for (const p of [
      "/",
      "/calculator",
      "/ar",
      "/ar/calculator",
      "/fr/nisab",
      "/nisab/pkr",
      "/tr/nisab/try",
      "/inheritance",
      "/zakat-al-fitr",
      "/halal-stocks",
      "/qurbani",
      "/guides",
      "/guides/zakat-on-gold",
    ]) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it("never counts pages inside an account", () => {
    for (const p of [
      "/dashboard",
      "/giving",
      "/ar/dashboard",
      "/settings",
      "/begin",
      "/mirath",
      "/screening",
      "/tools/fitr",
      "/tools/udhiyah",
    ]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});
