import { WebSocketServer, type WebSocket } from "ws";
import { AcpBridge } from "./bridge.js";
import { isValidToken } from "./pairing.js";
import { encodeServerMessage, parseClientMessage } from "./protocol.js";
import type { AcpProvider, ServerMessage } from "./types.js";

export interface BridgeServerOptions {
  provider: AcpProvider;
  port: number;
  token: string;
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(encodeServerMessage(message));
  }
}

/**
 * Starts the localhost-only WebSocket server and wires it to a single
 * shared {@link AcpBridge}. Returns a stop() to tear everything down (used
 * by tests and on agent crash).
 */
export async function startBridgeServer(
  options: BridgeServerOptions,
): Promise<{ wss: WebSocketServer; bridge: AcpBridge; stop: () => void }> {
  const bridge = new AcpBridge(options.provider);

  let exiting = false;
  await bridge.start((code, signal) => {
    if (exiting) return;
    exiting = true;
    console.error(
      `[socra-bridge] agent process exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"})`,
    );
    process.exitCode = 1;
    // Give in-flight error frames a tick to flush before shutting the
    // process down.
    setTimeout(() => process.exit(1), 100);
  });

  const wss = new WebSocketServer({ host: "127.0.0.1", port: options.port });

  wss.on("connection", (ws) => {
    let paired = false;

    ws.once("message", (raw) => {
      const result = parseClientMessage(raw.toString());
      if (!result.ok || result.message.type !== "pair" || !isValidToken(options.token, result.message.token)) {
        ws.close(4001, "pairing required");
        return;
      }
      paired = true;
      registerSessionHandlers(ws);
    });

    function registerSessionHandlers(socket: WebSocket): void {
      socket.on("message", async (raw) => {
        if (!paired) return;
        const result = parseClientMessage(raw.toString());
        if (!result.ok) {
          send(socket, { type: "error", message: result.error });
          return;
        }

        const message = result.message;
        try {
          if (message.type === "pair") {
            // Already paired; ignore repeats.
            return;
          }
          if (message.type === "start_session") {
            const sessionId = await bridge.startSession(message.systemPrompt, {
              onChunk: (text) => send(socket, { type: "chunk", sessionId, text }),
              onDone: () => send(socket, { type: "done", sessionId }),
              onError: (msg) => send(socket, { type: "error", message: msg, sessionId }),
              onTranscript: (role, text) =>
                send(socket, {
                  type: "transcript",
                  sessionId,
                  role,
                  text,
                  ts: new Date().toISOString(),
                }),
            });
            send(socket, { type: "session_started", sessionId });
            return;
          }
          if (message.type === "prompt") {
            await bridge.prompt(message.sessionId, message.text);
            return;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          send(socket, { type: "error", message: msg });
        }
      });
    }
  });

  return {
    wss,
    bridge,
    stop: () => {
      wss.close();
      bridge.stop();
    },
  };
}
