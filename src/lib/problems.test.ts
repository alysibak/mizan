import { describe, expect, it } from "vitest";
import { readProblem } from "./problems";

describe("report a problem", () => {
  it("keeps what the visitor wrote, the page, and the language", () => {
    expect(readProblem({ kind: "wrong", page: "/guide?x=1#y", note: " Gold came out too high ", contact: "", locale: "ur" })).toEqual({
      problem: { kind: "wrong", page: "/guide", note: "Gold came out too high", contact: null, locale: "ur" },
    });
  });

  it("never keeps a page on another site", () => {
    const r = readProblem({ kind: "other", page: "//evil.example/x", note: "hello there" });
    expect("problem" in r && r.problem.page).toBe("");
    const s = readProblem({ kind: "other", page: "https://evil.example/", note: "hello there" });
    expect("problem" in s && s.problem.page).toBe("");
  });

  it("asks for a kind and a few words", () => {
    expect(readProblem({ kind: "bad", note: "something" })).toEqual({ error: "Choose what kind of problem." });
    expect(readProblem({ kind: "hard", note: "x" })).toEqual({ error: "Say what happened, in a few words." });
  });
});
