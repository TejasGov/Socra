import {
  ClientSideConnection,
  RequestError,
  type Agent,
  type Client,
  type ReadTextFileResponse,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
  type WriteTextFileResponse,
} from "@zed-industries/agent-client-protocol";
import { spawnAgent, type SpawnedAgent } from "./agentProcess.js";
import { classifyPermissionRequest } from "./permissions.js";
import type { AcpProvider } from "./types.js";

const PROTOCOL_VERSION = 1;

export interface SessionHandlers {
  onChunk(text: string): void;
  onDone(): void;
  onError(message: string): void;
  onTranscript(role: "user" | "assistant", text: string): void;
}

interface SessionState extends SessionHandlers {
  sessionId: string;
  systemPrompt: string;
  systemPromptApplied: boolean;
  assistantBuffer: string;
}

/**
 * Wraps one spawned ACP agent process and its {@link ClientSideConnection}.
 * Implements {@link Client} to receive session updates and permission
 * requests from the agent, and fans session/update notifications out to
 * whichever WS session registered interest via {@link SessionState}.
 */
export class AcpBridge {
  private readonly provider: AcpProvider;
  private agent: SpawnedAgent | undefined;
  private conn: ClientSideConnection | undefined;
  private readonly sessions = new Map<string, SessionState>();
  private onAgentExit: ((code: number | null, signal: NodeJS.Signals | null) => void) | undefined;

  constructor(provider: AcpProvider) {
    this.provider = provider;
  }

  /** Spawns the agent process and performs the ACP `initialize` handshake. */
  async start(onAgentExit: (code: number | null, signal: NodeJS.Signals | null) => void): Promise<void> {
    this.onAgentExit = onAgentExit;
    const agent = spawnAgent(this.provider);
    this.agent = agent;

    agent.child.on("exit", (code, signal) => {
      const err = `${this.provider} agent process exited (code=${code ?? "null"}, signal=${signal ?? "null"})`;
      for (const session of this.sessions.values()) {
        session.onError(err);
      }
      this.onAgentExit?.(code, signal);
    });

    agent.child.on("error", (err) => {
      for (const session of this.sessions.values()) {
        session.onError(`failed to run ${this.provider} agent: ${err.message}`);
      }
    });

    const conn = new ClientSideConnection((_agentHandle: Agent) => this.buildClient(), agent.stream);
    this.conn = conn;

    await conn.initialize({
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
        terminal: false,
      },
    });
  }

  /** Creates a new ACP session and registers WS-facing handlers for it. */
  async startSession(systemPrompt: string, handlers: SessionHandlers): Promise<string> {
    const conn = this.requireConn();
    const { sessionId } = await conn.newSession({
      cwd: process.cwd(),
      mcpServers: [],
    });

    this.sessions.set(sessionId, {
      sessionId,
      systemPrompt,
      systemPromptApplied: false,
      assistantBuffer: "",
      ...handlers,
    });

    return sessionId;
  }

  /** Sends a user turn to an existing session and waits for it to finish. */
  async prompt(sessionId: string, text: string): Promise<void> {
    const conn = this.requireConn();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`unknown sessionId: ${sessionId}`);
    }

    session.onTranscript("user", text);

    // ACP has no first-class "system prompt" field on session/new, so we
    // prepend the tutoring instructions to the first user turn only, clearly
    // delimited so the agent can distinguish instructions from the
    // student's own words.
    let outgoingText = text;
    if (!session.systemPromptApplied && session.systemPrompt.trim().length > 0) {
      outgoingText = `[SYSTEM INSTRUCTIONS]\n${session.systemPrompt}\n[END SYSTEM INSTRUCTIONS]\n\n${text}`;
      session.systemPromptApplied = true;
    }

    session.assistantBuffer = "";
    await conn.prompt({
      sessionId,
      prompt: [{ type: "text", text: outgoingText }],
    });

    if (session.assistantBuffer.length > 0) {
      session.onTranscript("assistant", session.assistantBuffer);
    }
    session.onDone();
  }

  private requireConn(): ClientSideConnection {
    if (!this.conn) {
      throw new Error("bridge not started");
    }
    return this.conn;
  }

  private buildClient(): Client {
    return {
      sessionUpdate: async (params: SessionNotification): Promise<void> => {
        this.handleSessionUpdate(params);
      },
      requestPermission: async (
        params: RequestPermissionRequest,
      ): Promise<RequestPermissionResponse> => {
        return this.handlePermissionRequest(params);
      },
      // Chat-only bridge: never expose the student's filesystem or a shell
      // to the agent, regardless of what it asks for.
      readTextFile: async (): Promise<ReadTextFileResponse> => {
        throw RequestError.methodNotFound("fs/read_text_file");
      },
      writeTextFile: async (): Promise<WriteTextFileResponse> => {
        throw RequestError.methodNotFound("fs/write_text_file");
      },
    };
  }

  private handleSessionUpdate(params: SessionNotification): void {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      return;
    }

    const { update } = params;
    if (update.sessionUpdate === "agent_message_chunk" && update.content.type === "text") {
      session.assistantBuffer += update.content.text;
      session.onChunk(update.content.text);
    }
    // Tool call / plan / thought updates are intentionally not forwarded to
    // the browser: Socra is chat-only tutoring and the frontend only needs
    // the conversational text.
  }

  private handlePermissionRequest(
    params: RequestPermissionRequest,
  ): RequestPermissionResponse {
    const { option } = classifyPermissionRequest(params);
    if (!option) {
      return { outcome: { outcome: "cancelled" } };
    }
    return { outcome: { outcome: "selected", optionId: option.optionId } };
  }

  stop(): void {
    this.agent?.child.kill();
  }
}
