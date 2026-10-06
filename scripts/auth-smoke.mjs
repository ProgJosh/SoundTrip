import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthVanillaAdapter } from "@neondatabase/auth/vanilla/adapters";
import { randomUUID } from "node:crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";

// Deliberately uses a non-deliverable address and writes credentials only to an
// ignored local fixture. Run against a development branch, never production.
mkdirSync(".local", { recursive: true });
let saved = existsSync(".local/auth-test.json")
  ? JSON.parse(readFileSync(".local/auth-test.json", "utf8"))
  : null;
let cookie = "";
const origin = "http://127.0.0.1:8081";
const auth = createAuthClient(process.env.NEON_AUTH_BASE_URL, {
  adapter: BetterAuthVanillaAdapter({
    fetchOptions: {
      onRequest(request) {
        request.headers.set("Origin", origin);
        if (cookie) request.headers.set("Cookie", cookie);
      },
      onSuccess({ response }) {
        const values = response.headers.getSetCookie();
        if (values.length)
          cookie = values.map((v) => v.split(";")[0]).join("; ");
      },
    },
  }),
});
async function createFixture() {
  const email = `soundtrip-${randomUUID()}@example.invalid`;
  const password = randomUUID() + "Aa9!";
  const result = await auth.signUp.email({
    email,
    password,
    name: "SoundTrip verification",
    callbackURL: `${origin}/account`,
  });
  if (result.error)
    throw new Error(`Managed signup failed: ${result.error.message}`);
  saved = { id: result.data.user.id, email, password };
  writeFileSync(".local/auth-test.json", JSON.stringify(saved));
  console.log("Managed test signup: passed");
}
if (!saved) await createFixture();
const login = await auth.signIn.email({
  email: saved.email,
  password: saved.password,
  callbackURL: `${origin}/account`,
});
if (login.error)
  throw new Error(`Managed sign-in failed: ${login.error.message}`);
console.log("Managed sign-in: passed");
async function protectedRequest() {
  const session = await auth.getSession();
  if (!session.data?.user) throw new Error("Session restoration failed.");
  const token = session.data.session.token;
  const issuer = new URL(process.env.NEON_AUTH_BASE_URL).origin;
  await jwtVerify(
    token,
    createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL)),
    { issuer, audience: issuer, algorithms: ["EdDSA"] },
  );
  console.log("Managed session and JWT signature: passed");
  return fetch("http://127.0.0.1:8787/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cursor: 0, changes: [] }),
    signal: AbortSignal.timeout(15000),
  });
}
let response = await protectedRequest();
if (response.status === 410) {
  // The previous sync test intentionally deleted its metadata. A new identity
  // gets a new subject; deleted data is never restored or reset by the test.
  await auth.signOut();
  await createFixture();
  response = await protectedRequest();
}
if (!response.ok) throw new Error(`Protected API returned ${response.status}.`);
console.log("Protected development API: passed");
const signout = await auth.signOut();
if (signout.error) throw new Error("Managed sign-out failed.");
console.log("Managed sign-out: passed");
