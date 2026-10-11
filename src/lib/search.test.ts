import { describe, it, expect } from "vitest";
import { foldText, searchEntries } from "./search";

const entries = [
  { title: "Your salary", body: "Zakat is not paid on each salary." },
  { title: "Gold jewellery you wear", body: "Scholars differ on gold you wear." },
  { title: "Gold coins and bars", body: "Yes. Gold kept as savings is counted." },
  { title: "My mother or father", body: "No. Looking after your parents is your duty." },
];

describe("foldText", () => {
  it("ignores case, accents, and harakat", () => {
    expect(foldText("Zekâtı")).toBe(foldText("zekati"));
    expect(foldText("Épargne")).toBe("epargne");
    expect(foldText("الزَّكَاة")).toBe(foldText("الزكاه"));
  });

  it("treats the Arabic and Urdu forms of a letter alike", () => {
    expect(foldText("أمي")).toBe(foldText("امى"));
    expect(foldText("زکوٰۃ")).toBe(foldText("زكوه"));
  });
});

describe("searchEntries", () => {
  it("finds every entry with all the words, title matches first", () => {
    expect(searchEntries(entries, "gold").map((e) => e.title)).toEqual([
      "Gold jewellery you wear",
      "Gold coins and bars",
    ]);
    expect(searchEntries(entries, "gold wear").map((e) => e.title)).toEqual(["Gold jewellery you wear"]);
    expect(searchEntries(entries, "parents").map((e) => e.title)).toEqual(["My mother or father"]);
  });

  it("matches the start of words, past Arabic joined prefixes", () => {
    const fr = [
      { title: "Bijoux en or", body: "Les savants divergent." },
      { title: "Votre salaire", body: "Ce qui reste pour vous." },
    ];
    expect(searchEntries(fr, "or", "fr").map((e) => e.title)).toEqual(["Bijoux en or"]);
    const ar = [
      { title: "سبائك الذهب", body: "نعم." },
      { title: "راتبك", body: "لا تجب الزكاة على كل راتب." },
    ];
    expect(searchEntries(ar, "ذهب", "ar").map((e) => e.title)).toEqual(["سبائك الذهب"]);
    expect(searchEntries(ar, "زكاة", "ar").map((e) => e.title)).toEqual(["راتبك"]);
    expect(searchEntries([{ title: "بالذهب", body: "" }], "الذهب", "ar")).toHaveLength(1);
    // Urdu: سونا (gold) is written سونے after a postposition.
    expect(searchEntries([{ title: "سونے کے سکے", body: "" }], "سونا", "ur")).toHaveLength(1);
    expect(searchEntries([{ title: "والدین", body: "" }], "امی", "ur")).toHaveLength(0);
  });

  it("matches nothing for an empty or one-letter query", () => {
    expect(searchEntries(entries, "")).toEqual([]);
    expect(searchEntries(entries, " a ")).toEqual([]);
    expect(searchEntries(entries, "camel")).toEqual([]);
  });
});
