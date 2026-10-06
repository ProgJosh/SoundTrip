import "./native-random";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthVanillaAdapter } from "@neondatabase/auth/vanilla/adapters";
import { Platform } from "react-native";
import { getSecret, setSecret, removeSecret } from "./vault";
export type AccountUser = { id: string; email: string; name: string };
const url = process.env.EXPO_PUBLIC_NEON_AUTH_URL || "";
export const accountOrigin =
  process.env.EXPO_PUBLIC_ACCOUNT_ORIGIN ||
  (Platform.OS === "web" ? window.location.origin : "http://127.0.0.1:8081");
export const accountConfigured = !!url && !!process.env.EXPO_PUBLIC_API_URL;
let nativeCookie = "";
export async function prepareAccount() {
  if (Platform.OS !== "web")
    nativeCookie = (await getSecret("account.cookie")) || "";
}
export const auth = url
  ? createAuthClient(url, {
      adapter: BetterAuthVanillaAdapter(
        Platform.OS === "web"
          ? {}
          : {
              fetchOptions: {
                onRequest(request) {
                  request.headers.set("Origin", accountOrigin);
                  if (nativeCookie) request.headers.set("Cookie", nativeCookie);
                },
                async onSuccess({ response }) {
                  const cookies = response.headers.get("set-cookie");
                  if (!cookies) return;
                  const match = cookies.match(
                    /((?:__Secure-)?[\w.-]*session_token)=([^;,]*)/,
                  );
                  if (!match) return;
                  nativeCookie = match[2] ? `${match[1]}=${match[2]}` : "";
                  if (nativeCookie)
                    await setSecret("account.cookie", nativeCookie);
                  else await removeSecret("account.cookie");
                },
              },
            },
      ),
    })
  : null;
export async function accountToken() {
  if (!auth) throw new Error("Account services are not configured.");
  await prepareAccount();
  const { data, error } = await auth.getSession();
  const token = data?.session?.token;
  if (error || !token || token.split(".").length !== 3)
    throw new Error("Sign in again to sync your library.");
  return token;
}
export async function signOutAccount() {
  if (auth) {
    const result = await auth.signOut();
    if (result.error)
      throw new Error(
        result.error.message || "Sign-out failed. Try again when online.",
      );
  }
  nativeCookie = "";
  await removeSecret("account.cookie");
}
