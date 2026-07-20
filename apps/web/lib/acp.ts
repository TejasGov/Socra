// WebSocket client for the ACP bridge (`packages/acp-bridge`, run locally by
// the student via `npx socra-bridge`). Speaks the BridgeClientMessage /
// BridgeServerMessage protocol defined in @socra/shared-types and mirrors
// every transcript turn to the backend for the fine-tuning corpus.
// See docs/acp-integration.md.

import type {
  AcpMessageRole,
  BridgeClientMessage,
  BridgeServerMessage,
  BridgeTranscriptMessage,
} from "@socra/shared-types";

import { api } from "./api";
import { env } from "./env";

export interface AcpBridgeClientOptions {
  /** Backend `acp_sessions.id` messages are mirrored to. Set once the
   * student has accepted the consent modal and the session was created. */
  backendSessionId: string;
  /** Student's Supabase access token, forwarded on every mirrored message. */
  accessToken: string;
  /** Override the bridge URL (defaults to NEXT_PUBLIC_ACP_BRIDGE_URL). */
  url?: string;
}

export type AcpBridgeChunkHandler = (sessionId: string, text: string) => void;
export type AcpBridgeDoneHandler = (sessionId: string) => void;
export type AcpBridgeTranscriptHandler = (message: BridgeTranscriptMessage) => void;
export type AcpBridgeErrorHandler = (message: string, sessionId?: string) => void;

/**
 * Thin wrapper around a WebSocket connection to the student's local ACP
 * bridge. Does not talk to any vendor API directly — the bridge (running on
 * the student's machine) owns the ACP handshake and the subscription auth.
 */
export class AcpBridgeClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly backendSessionId: string;
  private readonly accessToken: string;

  onChunk?: AcpBridgeChunkHandler;
  onDone?: AcpBridgeDoneHandler;
  onTranscript?: AcpBridgeTranscriptHandler;
  onError?: AcpBridgeErrorHandler;

  constructor(options: AcpBridgeClientOptions) {
    this.url = options.url ?? env.acpBridgeUrl;
    this.backendSessionId = options.backendSessionId;
    this.accessToken = options.accessToken;
  }

  /** Opens the WebSocket and pairs using the token printed by `npx socra-bridge`. */
  connect(pairingToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = () => {
        this.send({ type: "pair", token: pairingToken });
        resolve();
      };

      ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      ws.onerror = () => {
        const message = "Could not reach the ACP bridge. Is `npx socra-bridge` running?";
        this.onError?.(message);
        reject(new Error(message));
      };

      ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  /** Starts a new ACP agent session with the Socratic system prompt. */
  startSession(systemPrompt: string): void {
    this.send({ type: "start_session", systemPrompt });
  }

  /** Forwards a student prompt to an active ACP session. */
  prompt(sessionId: string, text: string): void {
    this.send({ type: "prompt", sessionId, text });
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  private send(message: BridgeClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("ACP bridge connection is not open.");
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    let message: BridgeServerMessage;
    try {
      message = JSON.parse(data) as BridgeServerMessage;
    } catch {
      this.onError?.("Received a malformed message from the ACP bridge.");
      return;
    }

    switch (message.type) {
      case "chunk":
        this.onChunk?.(message.sessionId, message.text);
        break;
      case "done":
        this.onDone?.(message.sessionId);
        break;
      case "error":
        this.onError?.(message.message, message.sessionId);
        break;
      case "transcript":
        this.onTranscript?.(message);
        void this.mirrorTranscript(message.role, message.content);
        break;
    }
  }

  /** Mirrors a transcript turn to the backend for the fine-tuning corpus. */
  private async mirrorTranscript(role: AcpMessageRole, content: string): Promise<void> {
    try {
      await api.createAcpMessage(
        this.backendSessionId,
        { role, content },
        this.accessToken,
      );
    } catch {
      this.onError?.("Failed to mirror the transcript to the backend.");
    }
  }
}
