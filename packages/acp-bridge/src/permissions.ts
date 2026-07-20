import type { PermissionOption, RequestPermissionRequest, ToolKind } from "@zed-industries/agent-client-protocol";

/**
 * Socra is chat-only tutoring: the ACP agent runs on the student's machine
 * purely to talk, never to touch their filesystem or shell. Any tool call
 * that could mutate state or execute code is declined without prompting the
 * student; read-only inspection is allowed since it doesn't change anything
 * and some agents use it to ground answers (e.g. reading a file the student
 * is asking about).
 */
const DECLINE_KINDS: ReadonlySet<ToolKind> = new Set([
  "edit",
  "delete",
  "move",
  "execute",
]);

/** Kinds that are read-only or otherwise inert and safe to auto-allow. */
const ALLOW_KINDS: ReadonlySet<ToolKind> = new Set([
  "read",
  "search",
  "think",
  "fetch",
  "switch_mode",
]);

export type PermissionDecision = "allow" | "decline";

/**
 * Decides how to answer an agent's `session/request_permission` call without
 * involving the student. Unknown/unclassified tool kinds are declined —
 * conservative by default, per spec.
 */
export function decidePermission(kind: ToolKind | null | undefined): PermissionDecision {
  if (kind && ALLOW_KINDS.has(kind)) {
    return "allow";
  }
  if (kind && DECLINE_KINDS.has(kind)) {
    return "decline";
  }
  // "other", null, or undefined: unknown intent, decline conservatively.
  return "decline";
}

/**
 * Picks the concrete {@link PermissionOption} to return to the agent for a
 * given decision. Agents advertise their own option ids/kinds per request,
 * so we match by the option's `kind` rather than assuming a fixed id.
 */
export function selectPermissionOption(
  decision: PermissionDecision,
  options: PermissionOption[],
): PermissionOption | undefined {
  const wantedKinds =
    decision === "allow" ? ["allow_once", "allow_always"] : ["reject_once", "reject_always"];

  for (const wanted of wantedKinds) {
    const match = options.find((option) => option.kind === wanted);
    if (match) {
      return match;
    }
  }
  // No matching option offered at all (shouldn't happen per spec, but if it
  // does we fall back to the first "reject"-flavored option, or the first
  // option available, so we never silently hang the agent.
  return options.find((option) => option.kind.startsWith("reject")) ?? options[0];
}

export function classifyPermissionRequest(
  request: RequestPermissionRequest,
): { decision: PermissionDecision; option: PermissionOption | undefined } {
  const decision = decidePermission(request.toolCall.kind);
  const option = selectPermissionOption(decision, request.options);
  return { decision, option };
}
