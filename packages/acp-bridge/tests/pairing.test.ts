import { describe, expect, it } from "vitest";
import { generatePairingToken, isValidToken } from "../src/pairing.js";

describe("generatePairingToken", () => {
  it("produces a non-trivial, URL-safe token", () => {
    const token = generatePairingToken();
    expect(token.length).toBeGreaterThanOrEqual(24);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces distinct tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generatePairingToken()));
    expect(tokens.size).toBe(20);
  });
});

describe("isValidToken", () => {
  it("accepts a matching token", () => {
    const token = generatePairingToken();
    expect(isValidToken(token, token)).toBe(true);
  });

  it("rejects a mismatched token", () => {
    expect(isValidToken("expected-token", "wrong-token")).toBe(false);
  });

  it("rejects tokens of different length without throwing", () => {
    expect(isValidToken("short", "a-much-longer-candidate-token")).toBe(false);
  });

  it("rejects an empty candidate", () => {
    expect(isValidToken("expected-token", "")).toBe(false);
  });
});
