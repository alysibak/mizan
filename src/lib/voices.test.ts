import { describe, it, expect } from "vitest";
import { pickVoice, sentences } from "./voices";

const v = (name: string, lang: string, extra: { default?: boolean } = {}) => ({ name, lang, ...extra });

describe("pickVoice", () => {
  it("skips Apple's joke voices and old robotic ones for a natural one", () => {
    const voices = [
      v("Albert", "en-US"),
      v("Bad News", "en-US"),
      v("Fred", "en-US"),
      v("Samantha", "en-US", { default: true }),
      v("Ava (Enhanced)", "en-US"),
    ];
    expect(pickVoice(voices, "en")?.name).toBe("Ava (Enhanced)");
    expect(pickVoice(voices.slice(0, 4), "en")?.name).toBe("Samantha");
  });

  it("prefers Windows' natural and Google voices over Microsoft David", () => {
    const voices = [
      v("Microsoft David - English (United States)", "en-US", { default: true }),
      v("Google US English", "en-US"),
      v("Microsoft Aria Online (Natural) - English (United States)", "en-US"),
    ];
    expect(pickVoice(voices, "en")?.name).toBe("Microsoft Aria Online (Natural) - English (United States)");
    expect(pickVoice(voices.slice(0, 2), "en")?.name).toBe("Google US English");
  });

  it("keeps to the page's language, and offers nothing when only joke voices exist", () => {
    const voices = [v("Zarvox", "en-US"), v("Majed", "ar-001"), v("Urdu", "ur_PK")];
    expect(pickVoice(voices, "ur")?.name).toBe("Urdu");
    expect(pickVoice(voices, "ar")?.name).toBe("Majed");
    expect(pickVoice(voices, "en")).toBeNull();
    expect(pickVoice(voices, "fr")).toBeNull();
    // "ms" is Malay, not a prefix of some other tag.
    expect(pickVoice([v("Amira", "ms-MY"), v("X", "mse")], "ms")?.name).toBe("Amira");
  });
});

describe("sentences", () => {
  it("cuts at full stops, question marks, and the Urdu and Arabic ones", () => {
    expect(sentences("One. Two? Three!")).toEqual(["One.", "Two?", "Three!"]);
    expect(sentences("زکوٰۃ کیا ہے؟ یہ ایک حصہ ہے۔ بس")).toEqual(["زکوٰۃ کیا ہے؟", "یہ ایک حصہ ہے۔", "بس"]);
    expect(sentences("2.5% of 1,000 is 25.")).toEqual(["2.5% of 1,000 is 25."]);
  });
});
