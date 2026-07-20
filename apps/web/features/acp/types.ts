// UI-level provider selection. "hosted" maps to the existing Socra-hosted
// Gemma path (unchanged by this feature); "claude"/"codex" map 1:1 to the
// shared AcpProvider used by the bridge + backend contracts.
export type AcpUiProvider = "hosted" | "claude" | "codex";

/** A single rendered chat turn in the ACP chat UI. */
export interface AcpChatTurn {
  role: "user" | "assistant";
  content: string;
}
