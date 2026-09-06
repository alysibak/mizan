import { describe, expect, it } from "vitest";
import { asnafLabel, parseAsnaf, ASNAF } from "./asnaf";

describe("asnaf", () => {
  it("lists eight categories", () => {
    expect(ASNAF).toHaveLength(8);
  });

  it("parses known keys", () => {
    expect(parseAsnaf("gharim")).toBe("gharim");
    expect(parseAsnaf("nope")).toBeNull();
    expect(asnafLabel("faqir")).toMatch(/fuqara/i);
  });
});
