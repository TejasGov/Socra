import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Generates a random pairing token printed to stdout at bridge startup. The
 * student copies this into the web UI so the browser tab can prove it's the
 * one that launched the bridge, not some other localhost-reachable page.
 */
export function generatePairingToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Constant-time comparison of a candidate token against the expected one.
 * Avoids leaking token contents via timing side channels, even though the
 * practical exposure here (a local process) is low.
 */
export function isValidToken(expected: string, candidate: string): boolean {
  const expectedBuf = Buffer.from(expected, "utf8");
  const candidateBuf = Buffer.from(candidate, "utf8");
  if (expectedBuf.length !== candidateBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, candidateBuf);
}
