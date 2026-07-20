#!/usr/bin/env node
import { generatePairingToken } from "./pairing.js";
import { startBridgeServer } from "./server.js";
import type { AcpProvider } from "./types.js";

const DEFAULT_PORT = 8137;

interface ParsedArgs {
  provider: AcpProvider;
  port: number;
}

function parseArgs(argv: string[]): ParsedArgs {
  let provider: AcpProvider | undefined;
  let port = DEFAULT_PORT;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--provider") {
      const value = argv[++i];
      if (value !== "claude" && value !== "codex") {
        throw new Error(`--provider must be "claude" or "codex", got: ${value ?? "<missing>"}`);
      }
      provider = value;
    } else if (arg === "--port") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`--port must be a positive integer, got: ${argv[i]}`);
      }
      port = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!provider) {
    throw new Error("--provider claude|codex is required");
  }

  return { provider, port };
}

async function main(): Promise<void> {
  const { provider, port } = parseArgs(process.argv.slice(2));
  const token = generatePairingToken();

  console.log(`[socra-bridge] starting ${provider} agent...`);

  const { stop } = await startBridgeServer({ provider, port, token });

  console.log(`[socra-bridge] listening on ws://127.0.0.1:${port}`);
  console.log(`[socra-bridge] pairing token: ${token}`);
  console.log(`[socra-bridge] enter this token in the Socra web app to connect.`);

  const shutdown = () => {
    console.log("[socra-bridge] shutting down...");
    stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(`[socra-bridge] fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
