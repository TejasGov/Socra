// Shared contract types between the Socra frontend (apps/web) and backend
// (services/api). Keep these in sync with the backend Pydantic schemas.

export type AppEnv = "development" | "staging" | "production";

/** Roles a tutoring turn can originate from. */
export type ChatRole = "student" | "tutor" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Request body for a Socratic tutoring turn. */
export interface TutorRequest {
  courseId: string;
  messages: ChatMessage[];
}

/** Response for a Socratic tutoring turn. */
export interface TutorResponse {
  message: ChatMessage;
  modelVersion: string;
}

export interface HealthStatus {
  status: "ok";
  service: string;
  version: string;
}

// ---------------------------------------------------------------------------
// ACP (Agent Client Protocol) bring-your-own-subscription integration.
// See docs/acp-integration.md for the full design. Two contracts live here:
//   1. The bridge WebSocket protocol (apps/web <-> packages/acp-bridge,
//      running on the student's machine).
//   2. The backend transcript ingestion API (apps/web -> services/api),
//      which uses snake_case field names to mirror the FastAPI/Pydantic
//      schemas directly.
// ---------------------------------------------------------------------------

/** BYO-subscription ACP providers a student can pair with. */
export type AcpProvider = "claude" | "codex";

/** Roles recorded in an ACP transcript (matches the `acp_messages` check constraint). */
export type AcpMessageRole = "user" | "assistant" | "system";

// -- Bridge WebSocket protocol ----------------------------------------------

/** Sent by the browser to `packages/acp-bridge` to authorize the connection. */
export interface BridgePairMessage {
  type: "pair";
  token: string;
}

/** Sent by the browser to start a new ACP agent session with a system prompt. */
export interface BridgeStartSessionMessage {
  type: "start_session";
  systemPrompt: string;
}

/** Sent by the browser to forward a student prompt to an active ACP session. */
export interface BridgePromptMessage {
  type: "prompt";
  sessionId: string;
  text: string;
}

/** Union of every message the browser may send to the bridge. */
export type BridgeClientMessage =
  | BridgePairMessage
  | BridgeStartSessionMessage
  | BridgePromptMessage;

/** A streamed fragment of the agent's response. */
export interface BridgeChunkMessage {
  type: "chunk";
  sessionId: string;
  text: string;
}

/** Signals the agent has finished responding to the current prompt. */
export interface BridgeDoneMessage {
  type: "done";
  sessionId: string;
}

/** Signals a bridge- or agent-level failure. Not always tied to a session. */
export interface BridgeErrorMessage {
  type: "error";
  message: string;
  sessionId?: string;
}

/** A single completed transcript turn, mirrored to the backend for ingestion. */
export interface BridgeTranscriptMessage {
  type: "transcript";
  sessionId: string;
  role: AcpMessageRole;
  content: string;
  createdAt: string;
}

/** Union of every message the bridge may send to the browser. */
export type BridgeServerMessage =
  | BridgeChunkMessage
  | BridgeDoneMessage
  | BridgeErrorMessage
  | BridgeTranscriptMessage;

// -- Backend transcript API (services/api) -----------------------------------

/** Request body for `POST /api/v1/acp/sessions`. */
export interface AcpSessionCreate {
  provider: AcpProvider;
  course_id?: string;
  data_collection_consent: boolean;
}

/** Response body for a created/fetched ACP session. */
export interface AcpSession {
  id: string;
  user_id: string;
  provider: AcpProvider;
  course_id: string | null;
  data_collection_consent: boolean;
  created_at: string;
}

/** Request body for `POST /api/v1/acp/sessions/{id}/messages`. */
export interface AcpMessageCreate {
  role: AcpMessageRole;
  content: string;
  created_at?: string;
}

/** Response body for a created/fetched ACP transcript message. */
export interface AcpMessage {
  id: string;
  session_id: string;
  role: AcpMessageRole;
  content: string;
  created_at: string;
}
