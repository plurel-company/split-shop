import { it } from "node:test";
import assert from "node:assert/strict";
import { issueSessionCapability, hasSessionCapability } from "./session-capability";
const origin = "https://plurelpay.com";
const now = Date.now();
const expiry = new Date(now + 60_000).toISOString();
const create = new Request(`${origin}/api/demo-shop/plurel/v1/sessions`);
const secret = "plurel_sign_test";
const id = "merchant1";
const cookie = issueSessionCapability(create, "session1", expiry, secret, id, now)!;
const read = (cookieHeader = cookie.split(";")[0]!, requestOrigin = origin) => new Request(`${requestOrigin}/api/demo-shop/plurel/v1/sessions/session1`, { headers: { cookie: cookieHeader } });
it("capabilities are HttpOnly, secure, scoped and expire before their sessions", () => {
  assert.match(cookie, /Path=\/api\/demo-shop\/plurel\/v1\/sessions\/session1;/);
  assert.match(cookie, /HttpOnly; SameSite=Strict; Max-Age=60; Secure/);
  assert.equal(hasSessionCapability(read(), "session1", secret, id, now), true);
  assert.equal(hasSessionCapability(read(), "session1", secret, id, now + 61_000), false);
  assert.equal(issueSessionCapability(create, "session1", new Date(now - 1).toISOString(), secret, id, now), null);
});
it("missing, forged, wrong-session, wrong-merchant and cross-origin capabilities fail closed", () => {
  assert.equal(hasSessionCapability(read(""), "session1", secret, id, now), false);
  assert.equal(hasSessionCapability(read(), "session2", secret, id, now), false);
  assert.equal(hasSessionCapability(read(), "session1", secret, "merchant2", now), false);
  assert.equal(hasSessionCapability(read(undefined, "https://another.example"), "session1", secret, id, now), false);
  assert.equal(hasSessionCapability(read(), "session1", "wrong-secret", id, now), false);
  assert.equal(hasSessionCapability(read(cookie.split(";")[0]!.replace("=", "=x")), "session1", secret, id, now), false);
  assert.equal(hasSessionCapability(read(`${cookie.split(";")[0]}; ${cookie.split(";")[0]}`), "session1", secret, id, now), false);
});
