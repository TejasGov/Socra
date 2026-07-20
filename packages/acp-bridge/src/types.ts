/**
 * WebSocket message types exchanged between the browser (apps/web) and the
 * bridge. These are intentionally small, flat JSON objects — the bridge is a
 * transport, not a place to encode ACP semantics into the frontend.
 */

/** Provider adapters the bridge knows how to spawn. */
export type AcpProvider = "claude" | "codex";

/** First message a client must send before anything else is accepted. */
export interface PairMessage {
  type: "pair";
  token: string;
}

/** Ask the bridge to open a new ACP session with a given system prompt. */
export interface StartSessionMessage {
  type: "start_session";
  systemPrompt: string;
}

/** Send a user turn into an existing session. */
export interface PromptMessage {
  type: "prompt";
  sessionId: string;
  text: string;
}

export type ClientMessage = PairMessage | StartSessionMessage | PromptMessage;

/** Bridge -> browser: a new session was created. */
export interface SessionStartedMessage {
  type: "session_started";
  sessionId: string;
}

/** Bridge -> browser: a streamed fragment of agent output. */
export interface ChunkMessage {
  type: "chunk";
  sessionId: string;
  text: string;
}

/** Bridge -> browser: the current turn has finished. */
export interface DoneMessage {
  type: "done";
  sessionId: string;
}

/** Bridge -> browser: something went wrong. */
export interface ErrorMessage {
  type: "error";
  message: string;
  sessionId?: string;
}

/**
 * Bridge -> browser: a full user/assistant message, for the frontend to
 * mirror to services/api so it lands in the fine-tuning corpus (subject to
 * consent, enforced server-side).
 */
export interface TranscriptMessage {
  type: "transcript";
  sessionId: string;
  role: "user" | "assistant";
  text: string;
  ts: string;
}

export type ServerMessage =
  | SessionStartedMessage
  | ChunkMessage
  | DoneMessage
  | ErrorMessage
  | TranscriptMessage;

export function isClientMessageType(value: unknown): value is ClientMessage["type"] {
  return value === "pair" || value === "start_session" || value === "prompt";
}
