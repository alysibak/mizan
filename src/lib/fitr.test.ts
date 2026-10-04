import { describe, it, expect } from "vitest";
import { zakatAlFitr } from "./fitr";

describe("zakatAlFitr", () => {
  it("multiplies the announced amount by each person", () => {
    expect(zakatAlFitr(5, 15)).toMatchObject({ valid: true, total: 75 });
    expect(zakatAlFitr(3, 13.335).total).toBe(40.01);
  });

  it("asks for whole people and a positive amount", () => {
    expect(zakatAlFitr(0, 15).valid).toBe(false);
    expect(zakatAlFitr(2.5, 15).valid).toBe(false);
    expect(zakatAlFitr(4, 0).valid).toBe(false);
    expect(zakatAlFitr(4, Number.NaN).valid).toBe(false);
  });
});
