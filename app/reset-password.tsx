import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { auth } from "../src/services/account";
import { useLibrary } from "../src/state/Library";
import { Shell } from "../src/ui/Shell";
import { Button } from "../src/ui/kit";
import { styles } from "../src/ui/theme";
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { setError } = useLibrary();
  async function reset() {
    if (!auth || !token) return;
    setBusy(true);
    try {
      const result = await auth.resetPassword({ newPassword: password, token });
      if (result.error)
        throw new Error(result.error.message || "Reset failed.");
      setPassword("");
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <View style={[styles.card, { maxWidth: 480 }]}>
        <Text style={styles.title}>A fresh start.</Text>
        <Text style={styles.subtitle}>
          {done
            ? "Your account password has been reset. You can sign in again."
            : token
              ? "Choose a new SoundTrip account password."
              : "Open the password reset link from your email to continue."}
        </Text>
        {!done && token && (
          <>
            <TextInput
              accessibilityLabel="New account password"
              style={styles.input}
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
            />
            <Button
              primary
              disabled={!auth || busy || password.length < 8}
              onPress={() => {
                void reset();
              }}
            >
              Save new password
            </Button>
          </>
        )}
      </View>
    </Shell>
  );
}
