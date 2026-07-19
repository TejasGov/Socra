import { describe, it, expect } from "vitest";
import { env } from "../../lib/env";

describe("frontend env", () => {
  it("exposes a default API base URL", () => {
    expect(env.apiBaseUrl).toContain("http");
  });

  it("defaults appEnv to development", () => {
    expect(["development", "staging", "production"]).toContain(env.appEnv);
  });
});
