import React, { useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";
import { useAccount } from "../src/state/Account";
import { useLibrary } from "../src/state/Library";
import {
  accountConfigured,
  auth,
  accountOrigin,
  prepareAccount,
} from "../src/services/account";
import { Shell } from "../src/ui/Shell";
import { Button } from "../src/ui/kit";
import { c, styles } from "../src/ui/theme";
export default function Account() {
  const account = useAccount();
  const { state, setError } = useLibrary();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!auth) return;
    await prepareAccount();
    const result = signup
      ? await auth.signUp.email({
          email,
          password,
          name: name.trim() || "Listener",
          callbackURL: `${accountOrigin}/account`,
        })
      : await auth.signIn.email({
          email,
          password,
          callbackURL: `${accountOrigin}/account`,
        });
    if (result.error)
      throw new Error(result.error.message || "Sign-in failed.");
    setPassword("");
    await account.refreshSession();
  }
  return (
    <Shell>
      <View style={[styles.section, { maxWidth: 620 }]}>
        <Text style={styles.label}>YOUR LIBRARY, CONNECTED</Text>
        <Text style={styles.title}>
          {"Same music story.\nDifferent devices."}
        </Text>
        <Text style={styles.subtitle}>
          Sync playlists, favorites, moods, and track details. Your audio is
          always your choice.
        </Text>
        <View style={styles.card}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: c.teal, fontSize: 14, lineHeight: 22 }}
          >
            {account.message}
          </Text>
          <Text style={styles.subtitle}>
            {state.outbox.length} metadata edits queued on this device.
          </Text>
          {!accountConfigured && (
            <Text style={{ color: c.orange, lineHeight: 22 }}>
              Account services are not configured. Add the Managed Auth URL and
              metadata API URL. Your local library works without an account.
            </Text>
          )}
          {account.user ? (
            <>
              <Text style={{ color: c.text, fontSize: 20 }}>
                {account.user.name}
              </Text>
              <Text style={styles.subtitle}>{account.user.email}</Text>
              <Button
                primary
                disabled={busy || account.syncing}
                onPress={() => {
                  void account.sync();
                }}
              >
                {account.syncing ? "Syncing…" : "Sync metadata · online"}
              </Button>
              <Button
                disabled={busy}
                onPress={() => {
                  void run(account.signOut);
                }}
              >
                Sign out
              </Button>
              <Button
                disabled={busy}
                icon="trash-outline"
                onPress={() => setConfirm(true)}
              >
                Delete synced account data
              </Button>
            </>
          ) : (
            <>
              <TextInput
                accessibilityLabel="Account email"
                style={styles.input}
                placeholder="Your email"
                placeholderTextColor={c.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {signup && (
                <TextInput
                  accessibilityLabel="Account name"
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={c.muted}
                  value={name}
                  onChangeText={setName}
                />
              )}
              <TextInput
                accessibilityLabel="Account password"
                style={styles.input}
                placeholder="SoundTrip account password"
                placeholderTextColor={c.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={signup ? "new-password" : "current-password"}
              />
              <Button
                primary
                disabled={
                  !accountConfigured || busy || !email || password.length < 8
                }
                onPress={() => {
                  void run(submit);
                }}
              >
                {busy
                  ? "Connecting…"
                  : signup
                    ? "Create SoundTrip account"
                    : "Sign in to SoundTrip"}
              </Button>
              <Button disabled={busy} onPress={() => setSignup(!signup)}>
                {signup
                  ? "Already have an account? Sign in"
                  : "Create a new account"}
              </Button>
              <Button
                disabled={!accountConfigured || !email || busy}
                onPress={() => {
                  void run(async () => {
                    if (!auth) return;
                    const result = await auth.requestPasswordReset({
                      email,
                      redirectTo: `${accountOrigin}/reset-password`,
                    });
                    if (result.error)
                      throw new Error(
                        result.error.message || "Reset request failed.",
                      );
                    setError(
                      "Password reset requested. Check your email and follow the configured account recovery flow.",
                    );
                  });
                }}
              >
                Request password reset
              </Button>
            </>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>What travels between devices?</Text>
          <Text style={styles.subtitle}>
            Only metadata. A song stored on your phone will appear as missing on
            another device until you explicitly transfer and import its original
            file. Identical files reconnect by their SHA-256 fingerprint.
          </Text>
          <Text style={styles.subtitle}>
            Offline edits are saved locally and retried when connectivity
            returns. Conflicts use the latest edit timestamp for each metadata
            record; playlist ordering is a single record, so simultaneous edits
            resolve to one version.
          </Text>
          <Text style={styles.subtitle}>
            This device’s library is associated with its first signed-in
            account. Sign-out keeps local data. Use a separate browser profile
            or app installation for a different account.
          </Text>
        </View>
      </View>
      <Modal
        transparent
        visible={confirm}
        onRequestClose={() => setConfirm(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000aa",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View style={[styles.card, { maxWidth: 440 }]}>
            <Text style={{ color: c.text, fontSize: 22 }}>
              Delete cloud metadata?
            </Text>
            <Text style={styles.subtitle}>
              This deletes synced library records and signs out here. Local
              audio stays on this device. Uploads for this account are disabled
              so other devices cannot restore deleted data. Your sign-in
              identity remains with the account provider.
            </Text>
            <Button
              primary
              disabled={busy}
              onPress={() => {
                void run(async () => {
                  await account.deleteData();
                  setConfirm(false);
                });
              }}
            >
              Delete my synced data
            </Button>
            <Button onPress={() => setConfirm(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>
    </Shell>
  );
}
