import { describe, expect, it } from "vitest";
import { CODE_LENGTH, isMoveId, isSealed, makeCode, moveId, readCode, seal, showCode, unseal } from "./move";

describe("move codes", () => {
  it("are eight symbols a person can read out without mixing them up", () => {
    const code = makeCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect(makeCode(() => new Uint8Array(8))).toBe("22222222");
  });

  it("are read back however they were typed", () => {
    expect(readCode("k7p4-qx2m")).toBe("K7P4QX2M");
    expect(readCode(" K7P4 QX2M ")).toBe("K7P4QX2M");
    expect(showCode("K7P4QX2M")).toBe("K7P4-QX2M");
    // 0, O, 1 and I are never in a code.
    expect(readCode("K7P4-QX0M")).toBeNull();
    expect(readCode("K7P4-QX2")).toBeNull();
  });
});

describe("sealing", () => {
  it("opens only with the same code, and the server sees neither code nor figures", async () => {
    const code = "K7P4QX2M";
    const sealed = await seal(code, '{"mizan":1,"data":{"mizan-my-v1":"{}"}}');
    expect(isSealed(sealed)).toBe(true);
    expect(sealed).not.toContain("mizan-my-v1");
    expect(await unseal(code, sealed)).toBe('{"mizan":1,"data":{"mizan-my-v1":"{}"}}');
    expect(await unseal("K7P4QX2N", sealed)).toBeNull();
    expect(await unseal(code, "v1.nonsense.here")).toBeNull();
  });

  it("files the copy under a hash of the code, not the code", async () => {
    const id = await moveId("K7P4QX2M");
    expect(isMoveId(id)).toBe(true);
    expect(id).not.toContain("K7P4QX2M");
    expect(await moveId("K7P4QX2M")).toBe(id);
    expect(await moveId("K7P4QX2N")).not.toBe(id);
  });

  it("handles a large copy", async () => {
    const big = "x".repeat(200_000);
    expect(await unseal("ABCDEFGH", await seal("ABCDEFGH", big))).toBe(big);
  });
});
