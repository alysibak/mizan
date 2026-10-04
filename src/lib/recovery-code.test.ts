import { describe, it, expect } from "vitest";
import {
  generateRecoveryCode,
  hashRecoveryCode,
  normalizeRecoveryCode,
  recoveryCodeMatches,
} from "./recovery-code";

describe("recovery codes", () => {
  it("look like four readable groups", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[2-9A-HJKMNP-Z]{5}(-[2-9A-HJKMNP-Z]{5}){3}$/);
    expect(generateRecoveryCode()).not.toBe(code);
  });

  it("match regardless of case, spaces, and dashes", () => {
    const code = "K7M2Q-9XRTB-4HZ8W-PD3NA";
    const stored = hashRecoveryCode(code);
    expect(recoveryCodeMatches("k7m2q 9xrtb 4hz8w pd3na", stored)).toBe(true);
    expect(normalizeRecoveryCode(" k7m2q-9xrtb ")).toBe("K7M2Q9XRTB");
  });

  it("reject a wrong code or a missing hash", () => {
    const stored = hashRecoveryCode("K7M2Q-9XRTB-4HZ8W-PD3NA");
    expect(recoveryCodeMatches("K7M2Q-9XRTB-4HZ8W-PD3NB", stored)).toBe(false);
    expect(recoveryCodeMatches("anything", null)).toBe(false);
  });
});
