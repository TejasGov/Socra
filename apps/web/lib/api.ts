// Thin client for the Socra backend API. The frontend talks ONLY to the
// backend (never to the model server directly).

import type {
  AcpMessage,
  AcpMessageCreate,
  AcpSession,
  AcpSessionCreate,
} from "@socra/shared-types";

import { env } from "./env";

export interface ApiError {
  status: number;
  message: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw { status: res.status, message } satisfies ApiError;
  }

  return res.json() as Promise<T>;
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export const api = {
  health: () => request<{ status: string; service: string; version: string }>("/health"),

  // ACP (bring-your-own-subscription) transcript ingestion. Requires the
  // student's Supabase access token — see docs/acp-integration.md.
  createAcpSession: (payload: AcpSessionCreate, accessToken: string) =>
    request<AcpSession>("/api/v1/acp/sessions", {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    }),

  createAcpMessage: (sessionId: string, payload: AcpMessageCreate, accessToken: string) =>
    request<AcpMessage>(`/api/v1/acp/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
};
