import type { ClientMessage, ServerMessage } from "./types.js";
import { isClientMessageType } from "./types.js";

/**
 * Result of attempting to parse a raw WebSocket frame into a
 * {@link ClientMessage}. We never throw on malformed input — callers decide
 * whether a bad frame is a protocol error worth closing the socket over.
 */
export type ParseResult =
  | { ok: true; message: ClientMessage }
  | { ok: false; error: string };

/**
 * Parses and validates one newline-free JSON frame received from a browser
 * client. This is the WS-side analogue of ACP's newline-delimited
 * JSON-RPC-over-stdio framing: a single self-contained JSON object per
 * message, validated against the small message shapes we accept.
 */
export function parseClientMessage(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid JSON" };
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "message must be a JSON object" };
  }

  const record = data as Record<string, unknown>;
  if (!isClientMessageType(record.type)) {
    return { ok: false, error: "unknown or missing message type" };
  }

  switch (record.type) {
    case "pair": {
      if (typeof record.token !== "string" || record.token.length === 0) {
        return { ok: false, error: "pair message requires a non-empty token" };
      }
      return { ok: true, message: { type: "pair", token: record.token } };
    }
    case "start_session": {
      if (typeof record.systemPrompt !== "string") {
        return { ok: false, error: "start_session requires a systemPrompt string" };
      }
      return {
        ok: true,
        message: { type: "start_session", systemPrompt: record.systemPrompt },
      };
    }
    case "prompt": {
      if (typeof record.sessionId !== "string" || record.sessionId.length === 0) {
        return { ok: false, error: "prompt requires a non-empty sessionId" };
      }
      if (typeof record.text !== "string" || record.text.length === 0) {
        return { ok: false, error: "prompt requires non-empty text" };
      }
      return {
        ok: true,
        message: { type: "prompt", sessionId: record.sessionId, text: record.text },
      };
    }
  }
}

/** Serializes an outgoing message to the browser. Single source of truth so
 * the wire format can't drift between call sites. */
export function encodeServerMessage(message: ServerMessage): string {
  return JSON.stringify(message);
}
