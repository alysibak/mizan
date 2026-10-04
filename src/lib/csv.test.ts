import { describe, it, expect } from "vitest";
import { csvCell, csvRow } from "./csv";

describe("csv", () => {
  it("quotes commas, quotes, and newlines", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
  });

  it("defuses spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("writes numbers and blanks", () => {
    expect(csvRow(["2026-01-01", 12.5, null, undefined])).toBe("2026-01-01,12.5,,");
  });
});
