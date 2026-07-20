import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable, Writable } from "node:stream";
import { Readable as NodeReadable, Writable as NodeWritable } from "node:stream";
import { ndJsonStream, type Stream as AcpStream } from "@zed-industries/agent-client-protocol";
import type { AcpProvider } from "./types.js";

/** Maps a provider flag to the ACP adapter binary Socra knows how to launch. */
const PROVIDER_COMMANDS: Record<AcpProvider, { command: string; args: string[] }> = {
  claude: { command: "npx", args: ["-y", "@zed-industries/claude-code-acp"] },
  codex: { command: "npx", args: ["-y", "codex-acp"] },
};

export type AgentChildProcess = ChildProcessByStdio<Writable, Readable, null>;

export interface SpawnedAgent {
  child: AgentChildProcess;
  stream: AcpStream;
}

/**
 * Spawns the ACP agent adapter for the given provider and wraps its stdio in
 * an ACP {@link AcpStream}. stderr is left connected to the bridge's own
 * stderr so agent diagnostics show up in the student's terminal.
 */
export function spawnAgent(provider: AcpProvider): SpawnedAgent {
  const { command, args } = PROVIDER_COMMANDS[provider];
  const child = spawn(command, args, {
    stdio: ["pipe", "pipe", "inherit"],
  });

  const writable = Writable.toWeb(child.stdin) as WritableStream<Uint8Array>;
  const readable = Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>;
  const stream = ndJsonStream(writable, readable);

  return { child, stream };
}

export function providerNames(): AcpProvider[] {
  return Object.keys(PROVIDER_COMMANDS) as AcpProvider[];
}
