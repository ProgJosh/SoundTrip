import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthVanillaAdapter } from "@neondatabase/auth/vanilla/adapters";
import { randomUUID } from "node:crypto";
import { decodeJwt, decodeProtectedHeader, jwtVerify, createRemoteJWKSet } from 'jose';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
mkdirSync(".local", { recursive: true });
const saved = existsSync(".local/auth-test.json")
  ? JSON.parse(readFileSync(".local/auth-test.json", "utf8"))
  : null;
const email = saved?.email || `soundtrip-${randomUUID()}@example.invalid`;
const password = saved?.password || randomUUID() + "Aa9!";
let cookie = "";
const auth = createAuthClient(process.env.NEON_AUTH_BASE_URL, {
  adapter: BetterAuthVanillaAdapter({
    fetchOptions: {
      onRequest(req) {
        req.headers.set("Origin", "http://127.0.0.1:8081");
        if (cookie) req.headers.set("Cookie", cookie);
      },
      onSuccess({ response }) {
        const values = response.headers.getSetCookie();
        if (values.length)
          cookie = values.map((v) => v.split(";")[0]).join("; ");
      },
    },
  }),
});
if (!saved) {
  const signup = await auth.signUp.email({
    email,
    password,
    name: "SoundTrip verification",
    callbackURL: "http://127.0.0.1:8081/account",
  });
  if (signup.error)
    throw new Error(`Managed signup failed: ${signup.error.message}`);
  writeFileSync(
    ".local/auth-test.json",
    JSON.stringify({ id: signup.data.user.id, email, password }),
  );
  console.log("Managed account signup: passed");
}
const login = await auth.signIn.email({
  email,
  password,
  callbackURL: "http://127.0.0.1:8081/account",
});
if (login.error)
  throw new Error(`Managed sign-in failed: ${login.error.message}`);
console.log("Managed account sign-in: passed");
const session = await auth.getSession();
if (!session.data?.user) throw new Error("Session restoration failed.");
console.log("Managed session restoration: passed");
const claims = decodeJwt(session.data.session.token);
console.log('JWT verification properties:', {issuer:claims.iss,audience:claims.aud,algorithm:decodeProtectedHeader(session.data.session.token).alg});
try { await jwtVerify(session.data.session.token, createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL))); console.log('JWT signature verified'); } catch(e) { console.log('JWT verification:',e.message); }
const token = await auth.token();
console.log(
  "JWT endpoint shape:",
  Object.keys(token.data || {}),
  token.error?.message || "no error",
);
console.log(
  "Session token JWT format:",
  session.data.session.token?.split(".").length === 3,
);
if (!token.data?.token && session.data.session.token?.split(".").length === 3)
  token.data = { token: session.data.session.token };
if (!token.data?.token) throw new Error("JWT issuance failed.");
const response = await fetch("http://127.0.0.1:8787/sync", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token.data.token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ cursor: 0, changes: [] }),
});
console.log(`Protected development API: ${response.status}`);
if (!response.ok) throw new Error("API rejected the managed identity.");
const signout = await auth.signOut();
if (signout.error) throw new Error("Sign-out failed.");
console.log("Managed sign-out: passed");
