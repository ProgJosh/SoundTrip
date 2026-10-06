import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import * as Network from "expo-network";
import {
  AccountUser,
  accountConfigured,
  accountToken,
  auth,
  signOutAccount,
  prepareAccount,
} from "../services/account";
import { mergeSync, SyncResponse } from "../core/sync";
import { useLibrary, change, syncTrack } from "./Library";
type Context = {
  user: AccountUser | null;
  syncing: boolean;
  message: string;
  refreshSession: () => Promise<void>;
  sync: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteData: () => Promise<void>;
};
const AccountContext = createContext<Context | null>(null);
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { state, ready, update, checkpoint } = useLibrary();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(
    "Sign-in is optional. Your local player is ready.",
  );
  const latest = useRef(state);
  const account = useRef(user);
  const busy = useRef(false);
  const epoch = useRef(0);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    account.current = user;
  }, [user]);
  async function refreshSession() {
    if (!auth) return;
    await prepareAccount();
    const result = await auth.getSession();
    if (result.error)
      throw new Error(
        result.error.message || "Unable to restore your session.",
      );
    const u = result.data?.user;
    setUser(u ? { id: u.id, email: u.email, name: u.name } : null);
    account.current = u ? { id: u.id, email: u.email, name: u.name } : null;
  }
  useEffect(() => {
    if (ready && accountConfigured)
      Promise.resolve()
        .then(refreshSession)
        .catch(() =>
          setMessage(
            "Offline or signed out. Local music and queued edits are available.",
          ),
        );
  }, [ready]);
  async function sync() {
    if (busy.current || !account.current) return;
    const owner = account.current.id;
    const s = latest.current;
    if (s.syncOwner && s.syncOwner !== owner) {
      setMessage(
        "This local library is associated with another account. Sign in with that account to protect its private metadata.",
      );
      return;
    }
    busy.current = true;
    setSyncing(true);
    const generation = epoch.current;
    try {
      const network = await Network.getNetworkStateAsync();
      if (
        network.isConnected === false ||
        network.isInternetReachable === false
      ) {
        setMessage("Offline. Your edits are queued safely on this device.");
        return;
      }
      // Capture the batch; changes created during the request remain in the outbox.
      const batch = s.outbox.slice(0, 100);
      const token = await accountToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cursor: s.cursor, changes: batch }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 410) {
          epoch.current++;
          account.current = null;
          setUser(null);
          setMessage(
            body.error ||
              "Synced data was deleted. This account cannot upload it again.",
          );
          await signOutAccount().catch(() => {});
          return;
        }
        throw new Error(body.error || `Sync failed (${response.status}).`);
      }
      const data = (await response.json()) as SyncResponse;
      if (generation !== epoch.current || account.current?.id !== owner) return;
      update((local) => ({ ...mergeSync(local, data), syncOwner: owner }));
      await checkpoint();
      setMessage("Metadata is up to date. Audio stays on each device.");
    } catch (e) {
      setMessage(
        `${(e as Error).message} Local edits will retry when connected.`,
      );
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }
  useEffect(() => {
    if (!ready || !user) return;
    Promise.resolve().then(sync);
    const timer = setInterval(() => {
      void sync();
    }, 30000);
    const sub = Network.addNetworkStateListener((n) => {
      if (n.isConnected && n.isInternetReachable !== false) void sync();
    });
    const online = () => {
      void sync();
    };
    if (Platform.OS === "web") window.addEventListener("online", online);
    return () => {
      clearInterval(timer);
      sub.remove();
      if (Platform.OS === "web") window.removeEventListener("online", online);
    };
  }, [ready, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function signOut() {
    epoch.current++;
    await signOutAccount();
    account.current = null;
    setUser(null);
    setMessage("Signed out. Your local files and library stay on this device.");
  }
  async function deleteData() {
    if (!account.current)
      throw new Error("Sign in before deleting synced account data.");
    epoch.current++;
    const token = await accountToken();
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/account-data`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      throw new Error("Account data could not be deleted. Retry when online.");
    update((s) => ({ ...s, outbox: [], cursor: 0, syncOwner: undefined }));
    await checkpoint();
    await signOut();
    setMessage(
      "Synced metadata deleted. Uploads for this account are disabled so other devices cannot restore it. Local audio stays here.",
    );
  }
  // Associate the library only after the user deliberately signs in; all local
  // metadata is included when the first account starts syncing.
  useEffect(() => {
    if (!user || !ready || state.syncOwner) return;
    update((s) => ({
      ...s,
      syncOwner: user.id,
      outbox: [
        ...s.outbox,
        ...s.tracks.map((t) =>
          change("track", t.id, syncTrack(t), t.updatedAt),
        ),
        ...s.playlists.map((p) => change("playlist", p.id, p, p.updatedAt)),
      ],
    }));
  }, [user?.id, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AccountContext.Provider
      value={{
        user,
        syncing,
        message,
        refreshSession,
        sync,
        signOut,
        deleteData,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
export function useAccount() {
  const c = useContext(AccountContext);
  if (!c) throw new Error("AccountProvider missing");
  return c;
}
