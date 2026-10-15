import { describe, expect, it } from "vitest";
import { cropZakat, herdStep, herdZakat } from "./farm";

describe("cropZakat", () => {
  it("takes a tenth of a rain-watered harvest over the nisab", () => {
    expect(cropZakat(1200, "rain")).toEqual({ due: true, rate: 0.1, kg: 120 });
  });

  it("takes half a tenth when the land was watered at a cost", () => {
    expect(cropZakat(1200, "irrigated")).toEqual({ due: true, rate: 0.05, kg: 60 });
  });

  it("takes three quarters of a tenth when watered both ways", () => {
    expect(cropZakat(1000, "both").kg).toBe(75);
  });

  it("asks nothing below five awsuq", () => {
    expect(cropZakat(652, "rain").due).toBe(false);
    expect(cropZakat(653, "rain").due).toBe(true);
    expect(cropZakat(Number.NaN, "rain").due).toBe(false);
  });
});

describe("herdZakat: sheep and goats", () => {
  const sheep = (n: number) => herdZakat("sheep", n).map((d) => `${d.count} ${d.given}`).join(", ");
  it("follows the letter of Abu Bakr", () => {
    expect(sheep(39)).toBe("");
    expect(sheep(40)).toBe("1 sheep");
    expect(sheep(120)).toBe("1 sheep");
    expect(sheep(121)).toBe("2 sheep");
    expect(sheep(201)).toBe("3 sheep");
    expect(sheep(399)).toBe("3 sheep");
    expect(sheep(400)).toBe("4 sheep");
    expect(sheep(1050)).toBe("10 sheep");
  });
});

describe("herdZakat: cattle and buffalo", () => {
  const cattle = (n: number) => herdZakat("cattle", n).map((d) => `${d.count} ${d.given}`).join(", ");
  it("follows the hadith of Mu‘adh", () => {
    expect(cattle(29)).toBe("");
    expect(cattle(30)).toBe("1 tabi");
    expect(cattle(45)).toBe("1 musinnah");
    expect(cattle(60)).toBe("2 tabi");
    expect(cattle(70)).toBe("1 musinnah, 1 tabi");
    expect(cattle(80)).toBe("2 musinnah");
    expect(cattle(90)).toBe("3 tabi");
    expect(cattle(100)).toBe("1 musinnah, 2 tabi");
    // 120 is three forties or four thirties: the older animals are taken.
    expect(cattle(120)).toBe("3 musinnah");
    expect(cattle(129)).toBe("3 musinnah");
  });
});

describe("herdZakat: camels", () => {
  const camels = (n: number) => herdZakat("camels", n).map((d) => `${d.count} ${d.given}`).join(", ");
  it("follows the letter of Abu Bakr", () => {
    expect(camels(4)).toBe("");
    expect(camels(5)).toBe("1 sheep");
    expect(camels(14)).toBe("2 sheep");
    expect(camels(24)).toBe("4 sheep");
    expect(camels(25)).toBe("1 bintMakhad");
    expect(camels(36)).toBe("1 bintLabun");
    expect(camels(46)).toBe("1 hiqqah");
    expect(camels(61)).toBe("1 jadhaah");
    expect(camels(76)).toBe("2 bintLabun");
    expect(camels(91)).toBe("2 hiqqah");
    expect(camels(120)).toBe("2 hiqqah");
  });

  it("counts forties and fifties above 120", () => {
    expect(camels(121)).toBe("3 bintLabun");
    expect(camels(130)).toBe("1 hiqqah, 2 bintLabun");
    expect(camels(150)).toBe("3 hiqqah");
    expect(camels(200)).toBe("4 hiqqah");
  });
});

describe("herdStep", () => {
  it("finds the reader's row of the table", () => {
    expect(herdStep("sheep", 10)).toBe(-1);
    expect(herdStep("sheep", 150)).toBe(1);
    expect(herdStep("cattle", 75)).toBe(2);
    expect(herdStep("camels", 500)).toBe(7);
  });
});
