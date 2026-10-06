import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LibraryProvider } from "../src/state/Library";
import { PlaybackProvider } from "../src/state/Playback";
import { AccountProvider } from "../src/state/Account";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <AccountProvider>
          <PlaybackProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#101313" },
                animation: "none",
              }}
            />
          </PlaybackProvider>
        </AccountProvider>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}
