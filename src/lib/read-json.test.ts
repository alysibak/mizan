import { describe, expect, it } from "vitest";
import { readJson } from "./read-json";

function post(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new Request("http://test.invalid/api", { method: "POST", body, headers });
}

describe("readJson", () => {
  it("parses a JSON body", async () => {
    expect(await readJson(post(JSON.stringify({ a: 1 })))).toEqual({ a: 1 });
  });

  it("returns null for a missing or malformed body", async () => {
    expect(await readJson(post(null))).toBeNull();
    expect(await readJson(post("{not json"))).toBeNull();
  });

  it("refuses a body over the limit without parsing it", async () => {
    const big = JSON.stringify({ pad: "x".repeat(200) });
    expect(await readJson(post(big), 100)).toBeNull();
    expect(await readJson(post(big), 1000)).toEqual({ pad: "x".repeat(200) });
  });

  it("refuses a declared length over the limit", async () => {
    const req = post("{}", { "content-length": "5000000" });
    expect(await readJson(req, 1000)).toBeNull();
  });

  it("caps a streamed body that declares no length", async () => {
    const chunk = new TextEncoder().encode("x".repeat(64));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent++ > 100) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const req = new Request("http://test.invalid/api", {
      method: "POST",
      body: stream,
      // @ts-expect-error Node's fetch needs this for a streamed request body.
      duplex: "half",
    });
    expect(await readJson(req, 1024)).toBeNull();
  });

  it("decodes UTF-8 split across chunks", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ name: "ميزان" }));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const b of bytes) controller.enqueue(new Uint8Array([b]));
        controller.close();
      },
    });
    const req = new Request("http://test.invalid/api", {
      method: "POST",
      body: stream,
      // @ts-expect-error Node's fetch needs this for a streamed request body.
      duplex: "half",
    });
    expect(await readJson(req)).toEqual({ name: "ميزان" });
  });
});
