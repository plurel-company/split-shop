import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_SECONDS = 24 * 60 * 60;
const DOMAIN = "plurel-demo-session-capability-v1";
const SESSION_ID = /^[A-Za-z0-9_-]{1,160}$/;
const cookieName = (id: string) => `plurel_demo_${createHash("sha256").update(id).digest("hex").slice(0, 24)}`;
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(`${DOMAIN}.${payload}`).digest("base64url");

export function issueSessionCapability(request: Request, sessionId: string, expiresAt: string, secret: string, merchantId: string, now = Date.now()): string | null {
  const expiry = Math.min(Math.floor(Date.parse(expiresAt) / 1000), Math.floor(now / 1000) + MAX_AGE_SECONDS);
  if (!SESSION_ID.test(sessionId) || !secret || !merchantId || !Number.isFinite(expiry) || expiry <= Math.floor(now / 1000)) return null;
  const url = new URL(request.url);
  const payload = Buffer.from(JSON.stringify({ v: 1, sessionId, merchantId, origin: url.origin, environment: "sandbox", exp: expiry })).toString("base64url");
  // Narrow path keeps these cookies out of the hosted checkout and other merchant APIs.
  const path = url.pathname.slice(0, url.pathname.lastIndexOf("/sessions") + "/sessions".length);
  return `${cookieName(sessionId)}=${payload}.${sign(payload, secret)}; Path=${path}/${sessionId}; HttpOnly; SameSite=Strict; Max-Age=${expiry - Math.floor(now / 1000)}${url.protocol === "https:" ? "; Secure" : ""}`;
}

export function hasSessionCapability(request: Request, sessionId: string, secret: string, merchantId: string, now = Date.now()): boolean {
  if (!SESSION_ID.test(sessionId) || !secret || !merchantId) return false;
  const name = cookieName(sessionId);
  const cookies = (request.headers.get("cookie") ?? "").split(";").map(cookie => cookie.trim());
  const matching = cookies.filter(cookie => cookie.startsWith(`${name}=`));
  if (matching.length !== 1) return false;
  const token = matching[0]!.slice(name.length + 1);
  if (token.length > 1500 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return false;
  const [payload, signature] = token.split(".") as [string, string];
  const expected = sign(payload, secret);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    return claims.v === 1 && claims.sessionId === sessionId && claims.merchantId === merchantId &&
      claims.origin === new URL(request.url).origin && claims.environment === "sandbox" &&
      Number.isInteger(claims.exp) && claims.exp > seconds && claims.exp <= seconds + MAX_AGE_SECONDS;
  } catch { return false; }
}
