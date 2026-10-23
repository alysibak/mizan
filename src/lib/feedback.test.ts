import { describe, expect, it } from "vitest";
import { NOTE_MAX, countDay, isJourneyStep, readFeedback } from "./feedback";

describe("was this easy?", () => {
  it("takes a tap from a known place, in a known language", () => {
    expect(readFeedback({ page: "guide", easy: true, locale: "ur" })).toEqual({
      kind: "answer",
      page: "guide",
      easy: true,
      locale: "ur",
    });
    // An unknown language is kept as English, not refused.
    expect(readFeedback({ page: "account", easy: false, locale: "xx" })).toMatchObject({ locale: "en" });
  });

  it("refuses anything else", () => {
    expect(readFeedback(null)).toBeNull();
    expect(readFeedback("yes")).toBeNull();
    expect(readFeedback({ page: "admin", easy: true })).toBeNull();
    expect(readFeedback({ page: "guide", easy: "yes" })).toBeNull();
    expect(readFeedback({ id: "not-an-id", note: "hi" })).toBeNull();
  });

  it("takes a line for a tap, tidied and kept short", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    expect(readFeedback({ id, note: "  The gold step\u0000 was hard \n" })).toEqual({
      kind: "note",
      id,
      note: "The gold step was hard",
    });
    expect(readFeedback({ id, note: "x".repeat(NOTE_MAX + 50) })).toMatchObject({ note: "x".repeat(NOTE_MAX) });
    // Nothing to say is nothing to keep.
    expect(readFeedback({ id, note: "   " })).toBeNull();
  });
});

describe("journey counts", () => {
  it("know only their own steps", () => {
    expect(isJourneyStep("answer")).toBe(true);
    expect(isJourneyStep("dashboard")).toBe(false);
    expect(isJourneyStep(3)).toBe(false);
  });

  it("are kept by the day in UTC", () => {
    expect(countDay(new Date("2026-10-23T23:30:00-04:00"))).toBe("2026-10-24");
  });
});
