import { describe, expect, it } from "vitest";
import { encodeServerMessage, parseClientMessage } from "../src/protocol.js";

describe("parseClientMessage", () => {
  it("parses a valid pair message", () => {
    const result = parseClientMessage(JSON.stringify({ type: "pair", token: "abc123" }));
    expect(result).toEqual({ ok: true, message: { type: "pair", token: "abc123" } });
  });

  it("parses a valid start_session message", () => {
    const result = parseClientMessage(
      JSON.stringify({ type: "start_session", systemPrompt: "Be Socratic." }),
    );
    expect(result).toEqual({
      ok: true,
      message: { type: "start_session", systemPrompt: "Be Socratic." },
    });
  });

  it("parses a valid prompt message", () => {
    const result = parseClientMessage(
      JSON.stringify({ type: "prompt", sessionId: "s1", text: "hello" }),
    );
    expect(result).toEqual({
      ok: true,
      message: { type: "prompt", sessionId: "s1", text: "hello" },
    });
  });

  it("rejects malformed JSON", () => {
    const result = parseClientMessage("{not json");
    expect(result.ok).toBe(false);
  });

  it("rejects non-object JSON", () => {
    const result = parseClientMessage(JSON.stringify(["pair", "token"]));
    expect(result.ok).toBe(false);
  });

  it("rejects unknown message types", () => {
    const result = parseClientMessage(JSON.stringify({ type: "delete_everything" }));
    expect(result.ok).toBe(false);
  });

  it("rejects pair message with missing token", () => {
    const result = parseClientMessage(JSON.stringify({ type: "pair" }));
    expect(result.ok).toBe(false);
  });

  it("rejects pair message with empty token", () => {
    const result = parseClientMessage(JSON.stringify({ type: "pair", token: "" }));
    expect(result.ok).toBe(false);
  });

  it("rejects prompt message with missing text", () => {
    const result = parseClientMessage(JSON.stringify({ type: "prompt", sessionId: "s1" }));
    expect(result.ok).toBe(false);
  });

  it("rejects start_session message with non-string systemPrompt", () => {
    const result = parseClientMessage(
      JSON.stringify({ type: "start_session", systemPrompt: 42 }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("encodeServerMessage", () => {
  it("round-trips through JSON", () => {
    const message = { type: "chunk" as const, sessionId: "s1", text: "hi" };
    const encoded = encodeServerMessage(message);
    expect(JSON.parse(encoded)).toEqual(message);
  });
});
