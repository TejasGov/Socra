// App-local types for the Socra frontend.
// Cross-service contract types are mirrored in packages/shared-types;
// wire that package in as a workspace dependency when the monorepo adds
// workspace tooling.

export type AppEnv = "development" | "staging" | "production";

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
}
