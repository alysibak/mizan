import { describe, expect, it } from "vitest";
import {
  LOCALES,
  fmt,
  isLocalizedPath,
  languageAlternates,
  localePath,
  splitLocale,
} from "./config";
import { messagesFor } from "./messages";
import en from "./messages/en";

/** Every string in a message tree, by its path. */
function strings(node: unknown, path = ""): [string, string][] {
  if (typeof node === "string") return [[path, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("translations", () => {
  const english = new Map(strings(en));

  for (const locale of LOCALES) {
    it(`${locale} keeps every placeholder, and only those`, () => {
      const mismatched: string[] = [];
      for (const [path, text] of strings(messagesFor(locale))) {
        // Lists may differ in length between languages; compare by shape.
        const source = english.get(path) ?? english.get(path.replace(/\[\d+\]/g, "[0]"));
        if (source === undefined) continue;
        if (placeholders(source).join() !== placeholders(text).join()) mismatched.push(path);
      }
      expect(mismatched).toEqual([]);
    });

    it(`${locale} leaves nothing blank that English fills`, () => {
      const blank = strings(messagesFor(locale))
        .filter(([path, text]) => text.trim() === "" && (english.get(path) ?? "x").trim() !== "")
        .map(([path]) => path);
      expect(blank).toEqual([]);
    });
  }

  it("keeps the full FAQ in every language", () => {
    for (const locale of LOCALES) expect(messagesFor(locale).faq).toHaveLength(en.faq.length);
  });

  it("keeps the beginner page and next steps whole in every language", () => {
    for (const locale of LOCALES) {
      const m = messagesFor(locale);
      expect(m.start.counts, locale).toHaveLength(en.start.counts.length);
      expect(m.start.notCounts, locale).toHaveLength(en.start.notCounts.length);
      expect(m.start.words, locale).toHaveLength(en.start.words.length);
      expect(m.calc.nextSteps, locale).toHaveLength(en.calc.nextSteps.length);
    }
  });
});

describe("locale paths", () => {
  it("prefixes every language but English", () => {
    expect(localePath("en", "/calculator")).toBe("/calculator");
    expect(localePath("ar", "/calculator")).toBe("/ar/calculator");
    expect(localePath("fr", "/")).toBe("/fr");
  });

  it("splits a path back into language and page", () => {
    expect(splitLocale("/ur/calculator")).toEqual({ locale: "ur", path: "/calculator" });
    expect(splitLocale("/id")).toEqual({ locale: "id", path: "/" });
    expect(splitLocale("/dashboard")).toEqual({ locale: "en", path: "/dashboard" });
    expect(splitLocale("/en/calculator")).toEqual({ locale: "en", path: "/en/calculator" });
  });

  it("knows which pages exist in every language", () => {
    for (const path of ["/", "/start", "/calculator", "/nisab", "/nisab/pkr"]) {
      expect(isLocalizedPath(path), path).toBe(true);
    }
    for (const path of ["/privacy", "/guides", "/nisab/PKR", "/nisab/pkr/x", "/inheritance"]) {
      expect(isLocalizedPath(path), path).toBe(false);
    }
  });

  it("lists every language for hreflang, with English as the default", () => {
    const alt = languageAlternates("/calculator");
    expect(alt["x-default"]).toBe("/calculator");
    expect(alt.tr).toBe("/tr/calculator");
    expect(Object.keys(alt)).toHaveLength(LOCALES.length + 1);
  });

  it("fills placeholders and leaves unknown ones alone", () => {
    expect(fmt("{a} of {b}", { a: 1, b: "two" })).toBe("1 of two");
    expect(fmt("{a} {missing}", { a: "x" })).toBe("x {missing}");
  });
});
