# @socra/acp-bridge

A small Node CLI that runs on a student's own machine and bridges a local
[ACP](https://agentclientprotocol.com) (Agent Client Protocol) agent — the
student's own Claude Code or Codex subscription — to a localhost WebSocket
that the Socra web app connects to.

See [`docs/acp-integration.md`](../../docs/acp-integration.md) at the repo
root for the full architecture and rationale.

## Why this exists

Claude Code and Codex authenticate with the student's own subscription, and
that login only exists on the student's machine — the Socra web app cannot
spawn these agents server-side. Instead, the student runs this bridge
locally; it spawns the ACP agent as a child process, speaks ACP over stdio,
and exposes a WebSocket the browser tab connects to directly.

## Install & run

No install needed — run it with `npx`:

```bash
npx socra-bridge --provider claude
# or
npx socra-bridge --provider codex
```

This will:

1. Spawn the ACP adapter for the chosen provider
   (`npx @zed-industries/claude-code-acp` or `npx codex-acp`) and perform the
   ACP `initialize` handshake.
2. Start a WebSocket server bound to `127.0.0.1` only (never reachable from
   outside your machine) on port `8137` by default.
3. Print a one-time pairing token to stdout, e.g.:

   ```text
   [socra-bridge] listening on ws://127.0.0.1:8137
   [socra-bridge] pairing token: 3f9c2b1a...
   [socra-bridge] enter this token in the Socra web app to connect.
   ```

4. Paste that token into the Socra web app's "Connect your own Claude/Codex"
   prompt. The web app opens a WebSocket to the bridge and sends
   `{"type":"pair","token":"..."}` as its first message — any other first
   message, or a wrong token, closes the connection immediately.

### Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--provider` | yes | — | `claude` or `codex` |
| `--port` | no | `8137` | Port for the localhost WebSocket server |

### From source (this repo)

```bash
cd packages/acp-bridge
npm install
npm run build
node dist/cli.js --provider claude
```

## WebSocket protocol

All messages are single JSON objects, one per WS frame (no additional
framing needed — WebSocket already delivers whole messages).

**Browser → bridge**

| `type` | Fields | Purpose |
|---|---|---|
| `pair` | `token` | Must be the first message on every connection. |
| `start_session` | `systemPrompt` | Opens a new ACP session (`session/new`) and stages the Socratic system prompt to be applied on the first turn. |
| `prompt` | `sessionId`, `text` | Sends a user turn (`session/prompt`). |

**Bridge → browser**

| `type` | Fields | Purpose |
|---|---|---|
| `session_started` | `sessionId` | Acknowledges `start_session`. |
| `chunk` | `sessionId`, `text` | Streamed fragment of the agent's reply. |
| `done` | `sessionId` | The current turn has finished. |
| `error` | `message`, `sessionId?` | Something failed (bad message, agent crash, ACP error). |
| `transcript` | `sessionId`, `role`, `text`, `ts` | Full user/assistant message, for the frontend to mirror to `services/api` (subject to the student's data-collection consent, enforced server-side). |

## Permissions

Socra is chat-only tutoring — the agent should never touch the student's
filesystem or run commands through this bridge. The bridge auto-resolves
every `session/request_permission` call from the agent without prompting the
student:

- Read-only tool kinds (`read`, `search`, `think`, `fetch`, `switch_mode`)
  are **auto-allowed**.
- Anything that can mutate state (`edit`, `delete`, `move`, `execute`) — and
  any unrecognized tool kind — is **auto-declined**.

`fs/read_text_file` and `fs/write_text_file` requests from the agent are
also rejected outright at the ACP layer (the bridge advertises no filesystem
capability during `initialize`).

## Agent crashes

If the spawned agent process exits unexpectedly, the bridge sends an `error`
message to every connected client and then exits with a non-zero status
code.

## Development

```bash
npm install
npm run build       # tsc -> dist/
npm test            # vitest
npm run typecheck
```
