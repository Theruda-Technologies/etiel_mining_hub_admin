import { createHash, randomBytes } from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function createPasswordResetToken() {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashPasswordResetToken(raw),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  };
}

export function hashPasswordResetToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function isPasswordResetExpired(expiresAt: unknown) {
  if (typeof expiresAt !== "string" || !expiresAt) return true;
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) return true;
  return ts < Date.now();
}
