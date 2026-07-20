import { describe, expect, it } from "vitest";
import { classifyPermissionRequest, decidePermission, selectPermissionOption } from "../src/permissions.js";
import type { PermissionOption, RequestPermissionRequest } from "@zed-industries/agent-client-protocol";

describe("decidePermission", () => {
  it("allows read-only tool kinds", () => {
    expect(decidePermission("read")).toBe("allow");
    expect(decidePermission("search")).toBe("allow");
    expect(decidePermission("think")).toBe("allow");
    expect(decidePermission("fetch")).toBe("allow");
  });

  it("declines write/execute tool kinds", () => {
    expect(decidePermission("edit")).toBe("decline");
    expect(decidePermission("delete")).toBe("decline");
    expect(decidePermission("move")).toBe("decline");
    expect(decidePermission("execute")).toBe("decline");
  });

  it("declines unknown or missing tool kinds conservatively", () => {
    expect(decidePermission("other")).toBe("decline");
    expect(decidePermission(null)).toBe("decline");
    expect(decidePermission(undefined)).toBe("decline");
  });
});

const allowOnce: PermissionOption = { kind: "allow_once", name: "Allow", optionId: "allow-1" };
const rejectOnce: PermissionOption = { kind: "reject_once", name: "Reject", optionId: "reject-1" };

describe("selectPermissionOption", () => {
  it("picks an allow option when allowed", () => {
    expect(selectPermissionOption("allow", [rejectOnce, allowOnce])).toBe(allowOnce);
  });

  it("picks a reject option when declined", () => {
    expect(selectPermissionOption("decline", [rejectOnce, allowOnce])).toBe(rejectOnce);
  });

  it("falls back to a reject-flavored option if the wanted kind is absent", () => {
    expect(selectPermissionOption("allow", [rejectOnce])).toBe(rejectOnce);
  });
});

describe("classifyPermissionRequest", () => {
  it("declines a file-write permission request", () => {
    const request: RequestPermissionRequest = {
      sessionId: "s1",
      options: [allowOnce, rejectOnce],
      toolCall: { toolCallId: "t1", kind: "edit" },
    };
    const { decision, option } = classifyPermissionRequest(request);
    expect(decision).toBe("decline");
    expect(option?.optionId).toBe("reject-1");
  });

  it("declines an execute permission request", () => {
    const request: RequestPermissionRequest = {
      sessionId: "s1",
      options: [allowOnce, rejectOnce],
      toolCall: { toolCallId: "t2", kind: "execute" },
    };
    const { decision } = classifyPermissionRequest(request);
    expect(decision).toBe("decline");
  });

  it("allows a read-only permission request", () => {
    const request: RequestPermissionRequest = {
      sessionId: "s1",
      options: [allowOnce, rejectOnce],
      toolCall: { toolCallId: "t3", kind: "read" },
    };
    const { decision, option } = classifyPermissionRequest(request);
    expect(decision).toBe("allow");
    expect(option?.optionId).toBe("allow-1");
  });
});
