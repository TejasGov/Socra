// Frontend-safe environment access.
// Only NEXT_PUBLIC_* variables may be read here — anything else is
// backend-only and must never enter the browser bundle.

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Fail loudly in development; in production the build should have
    // provided these. Keep the message free of secret values.
    throw new Error(`Missing required public env var: ${name}`);
  }
  return value;
}

export const env = {
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Localhost WebSocket exposed by `packages/acp-bridge` (`npx socra-bridge`)
  // running on the student's own machine. See docs/acp-integration.md.
  acpBridgeUrl:
    process.env.NEXT_PUBLIC_ACP_BRIDGE_URL ?? "ws://127.0.0.1:8137",
} as const;

// Re-exported so callers can assert when a value is truly required.
export { required };
