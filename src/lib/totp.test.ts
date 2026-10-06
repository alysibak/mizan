import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  groupSecret,
  hotp,
  newTotpSecret,
  otpauthUri,
  totpStep,
  verifyTotp,
} from "./totp";

// RFC 6238 appendix B uses the ASCII secret "12345678901234567890" (SHA-1).
const RFC_SECRET = Buffer.from("12345678901234567890");
const RFC_BASE32 = base32Encode(RFC_SECRET);

describe("base32", () => {
  it("round-trips and matches the RFC 4648 vectors", () => {
    expect(base32Encode(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
    expect(base32Decode("MZXW6YTBOI").toString()).toBe("foobar");
    expect(base32Decode("mzxw 6ytb-oi======").toString()).toBe("foobar");
    expect(() => base32Decode("not base32!")).toThrow();
  });

  it("makes 160-bit secrets", () => {
    const secret = newTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
    expect(newTotpSecret()).not.toBe(secret);
  });
});

describe("hotp and totp", () => {
  it("matches the RFC 4226 HOTP vectors", () => {
    expect(hotp(RFC_SECRET, 0)).toBe("755224");
    expect(hotp(RFC_SECRET, 1)).toBe("287082");
    expect(hotp(RFC_SECRET, 9)).toBe("520489");
  });

  it("matches the RFC 6238 TOTP vectors (last six digits)", () => {
    const cases: [number, string][] = [
      [59, "287082"],
      [1111111109, "081804"],
      [1234567890, "005924"],
      [2000000000, "279037"],
    ];
    for (const [seconds, code] of cases) {
      expect(verifyTotp(RFC_BASE32, code, { now: seconds * 1000 })).toBe(totpStep(seconds * 1000));
    }
  });

  it("allows one step of clock drift either way, not two", () => {
    const now = 1234567890 * 1000;
    const step = totpStep(now);
    expect(verifyTotp(RFC_BASE32, hotp(RFC_SECRET, step - 1), { now })).toBe(step - 1);
    expect(verifyTotp(RFC_BASE32, hotp(RFC_SECRET, step + 1), { now })).toBe(step + 1);
    expect(verifyTotp(RFC_BASE32, hotp(RFC_SECRET, step - 2), { now })).toBeNull();
  });

  it("refuses a code from a step already used", () => {
    const now = 1234567890 * 1000;
    const step = totpStep(now);
    const code = hotp(RFC_SECRET, step);
    expect(verifyTotp(RFC_BASE32, code, { now, lastUsedStep: step })).toBeNull();
    expect(verifyTotp(RFC_BASE32, code, { now, lastUsedStep: step - 1 })).toBe(step);
  });

  it("refuses anything but six digits", () => {
    for (const bad of ["", "12345", "1234567", "abcdef", "12 34 5"]) {
      expect(verifyTotp(RFC_BASE32, bad)).toBeNull();
    }
    expect(verifyTotp("not base32!", "123456")).toBeNull();
  });
});

describe("setup helpers", () => {
  it("builds the otpauth link apps expect", () => {
    const uri = otpauthUri({ secret: "JBSWY3DPEHPK3PXP", account: "a@b.c", issuer: "Mizan" });
    expect(uri).toBe(
      "otpauth://totp/Mizan%3Aa%40b.c?secret=JBSWY3DPEHPK3PXP&issuer=Mizan&algorithm=SHA1&digits=6&period=30",
    );
  });

  it("groups the secret for typing", () => {
    expect(groupSecret("JBSWY3DPEHPK3PXP")).toBe("JBSW Y3DP EHPK 3PXP");
  });
});
