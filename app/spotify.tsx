import React, { useEffect, useRef, useState } from "react";
import { Image, Linking, Platform, Text, View } from "react-native";
import { useLibrary } from "../src/state/Library";
import { usePlayback } from "../src/state/Playback";
import { matchLocal } from "../src/core/model";
import { SPOTIFY_METADATA_TTL } from "../src/core/spotify";
import {
  connectedSpotify,
  connectSpotify,
  disconnectSpotify,
  importSpotifyPlaylist,
  listSpotifyPlaylists,
  spotifyConfigured,
  SpotifySummary,
} from "../src/services/spotify";
import { Shell } from "../src/ui/Shell";
import { Button, Empty } from "../src/ui/kit";
import { c, styles } from "../src/ui/theme";
export default function Spotify() {
  const { state, update, setError, checkpoint } = useLibrary();
  const playback = usePlayback();
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifySummary[]>([]);
  const epoch = useRef(0);
  useEffect(() => {
    connectedSpotify().then(setConnected);
    update((s) => ({
      ...s,
      spotify: s.spotify.filter(
        (p) => Date.now() - p.importedAt < SPOTIFY_METADATA_TTL,
      ),
    }));
    const timer = setInterval(
      () =>
        update((s) => ({
          ...s,
          spotify: s.spotify.filter(
            (p) => Date.now() - p.importedAt < SPOTIFY_METADATA_TTL,
          ),
        })),
      60000,
    );
    return () => {
      clearInterval(timer);
      // Cancellation counter; this ref is intentionally read at cleanup time.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(fn: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function disconnect() {
    epoch.current++;
    await disconnectSpotify();
    setConnected(false);
    setPlaylists([]);
    update((s) => ({ ...s, spotify: [] }));
    await checkpoint();
  }
  return (
    <Shell>
      <View style={styles.section}>
        <Text style={styles.label}>A CONNECTION, ON YOUR TERMS</Text>
        <Text style={styles.title}>Bring your playlist ideas.</Text>
        <Text style={styles.subtitle}>
          Spotify metadata is a reference. Your local audio is what plays here.
        </Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Connect securely through Spotify’s official authorization. SoundTrip
            requests read-only access to permitted playlist metadata. No Spotify
            password is entered here, and no Spotify audio is downloaded,
            cached, recorded, or played by SoundTrip.
          </Text>
          <Text style={styles.subtitle}>
            An internet connection is required for sign-in and refresh.
            Development apps need an owner with Premium and allowlisted users;
            playlist contents may only be available for playlists you own or
            collaborate on. Some items will be unavailable.
          </Text>
          {!spotifyConfigured && (
            <Text style={{ color: c.orange, fontSize: 13 }}>
              Spotify setup is not configured. Add the public client ID and
              registered redirect URI to enable this connection.
            </Text>
          )}
          <View style={styles.wrap}>
            {connected ? (
              <>
                <Button
                  primary
                  disabled={pending}
                  icon="refresh"
                  onPress={() => {
                    void run(async () => {
                      const current = epoch.current;
                      const result = await listSpotifyPlaylists();
                      if (current === epoch.current) setPlaylists(result);
                    });
                  }}
                >
                  Refresh playlists · online
                </Button>
                <Button
                  disabled={pending}
                  onPress={() => {
                    void run(disconnect);
                  }}
                >
                  Disconnect & delete Spotify data
                </Button>
              </>
            ) : (
              <Button
                primary
                disabled={pending || !spotifyConfigured}
                onPress={() => {
                  void run(async () => {
                    if (await connectSpotify()) setConnected(true);
                  });
                }}
              >
                Connect Spotify · online
              </Button>
            )}
          </View>
          <Text style={styles.subtitle}>
            Disconnect removes tokens, imported metadata, and local matching
            links immediately. To revoke authorization at Spotify too, visit
            your Spotify Apps page. Metadata references expire locally after 24
            hours and are never synced to SoundTrip’s cloud.
          </Text>
          <Button
            onPress={() => {
              void Linking.openURL("https://www.spotify.com/account/apps/");
            }}
          >
            Open Spotify account apps
          </Button>
          {Platform.OS === "web" && (
            <Text style={styles.subtitle}>
              For browser security, Spotify tokens stay in memory. Reloading
              requires reconnecting.
            </Text>
          )}
        </View>
        {playlists.map((p) => (
          <View
            key={p.id}
            style={[
              styles.card,
              styles.row,
              { justifyContent: "space-between", flexWrap: "wrap" },
            ]}
          >
            <Text style={{ color: c.text }}>{p.name}</Text>
            <Button
              disabled={pending}
              onPress={() => {
                void run(async () => {
                  const current = epoch.current;
                  const imported = await importSpotifyPlaylist(p);
                  if (current !== epoch.current) return;
                  update((s) => ({
                    ...s,
                    spotify: [
                      ...s.spotify.filter((v) => v.id !== p.id),
                      imported,
                    ],
                  }));
                });
              }}
            >
              Import metadata · online
            </Button>
          </View>
        ))}
        {state.spotify.map((p) => (
          <View key={p.id} style={styles.card}>
            <View
              style={[
                styles.row,
                { justifyContent: "space-between", flexWrap: "wrap" },
              ]}
            >
              <Text style={{ color: c.text, fontSize: 22 }}>{p.name}</Text>
              <View style={styles.row}>
                <Image
                  source={require("../assets/spotify-logo.png")}
                  accessibilityLabel="Spotify"
                  style={{ width: 96, height: 29, resizeMode: "contain" }}
                />
                <Text style={{ color: c.muted }}>Metadata from Spotify</Text>
              </View>
            </View>
            <Button
              onPress={() => {
                void Linking.openURL(p.url);
              }}
            >
              Open playlist in Spotify
            </Button>
            {p.entries.map((entry, i) => {
              const suggestions = matchLocal(entry, state.tracks);
              const local = state.tracks.find(
                (t) => t.id === entry.localTrackId,
              );
              return (
                <View
                  key={`${entry.id}-${i}`}
                  style={{
                    borderTopWidth: 1,
                    borderColor: c.border,
                    paddingTop: 16,
                    gap: 10,
                  }}
                >
                  <Text style={{ color: c.text }}>
                    {entry.title} · {entry.artist}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    Spotify reference · {entry.album}
                  </Text>
                  <View style={styles.wrap}>
                    <Button
                      onPress={() => {
                        void Linking.openURL(entry.url);
                      }}
                    >
                      Open in Spotify
                    </Button>
                    {local ? (
                      <>
                        <Button
                          icon="play"
                          disabled={!state.files[local.id]}
                          onPress={() => {
                            void playback.play([local.id]);
                          }}
                        >
                          Play your local file
                        </Button>
                        <Button
                          onPress={() =>
                            update((s) => ({
                              ...s,
                              spotify: s.spotify.map((v) =>
                                v.id === p.id
                                  ? {
                                      ...v,
                                      entries: v.entries.map((e, n) =>
                                        n === i
                                          ? { ...e, localTrackId: undefined }
                                          : e,
                                      ),
                                    }
                                  : v,
                              ),
                            }))
                          }
                        >
                          Unlink file
                        </Button>
                      </>
                    ) : (
                      suggestions.map((t) => (
                        <Button
                          key={t.id}
                          onPress={() =>
                            update((s) => ({
                              ...s,
                              spotify: s.spotify.map((v) =>
                                v.id === p.id
                                  ? {
                                      ...v,
                                      entries: v.entries.map((e, n) =>
                                        n === i
                                          ? { ...e, localTrackId: t.id }
                                          : e,
                                      ),
                                    }
                                  : v,
                              ),
                            }))
                          }
                        >
                          Confirm match: {t.filename}
                        </Button>
                      ))
                    )}
                  </View>
                  {!local && !suggestions.length && (
                    <Text style={styles.subtitle}>
                      No matching local file. Import a file you own and check
                      its title and artist.
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        {!state.spotify.length && (
          <Empty
            title="Your own files make it offline"
            description="A Spotify playlist entry does not contain audio. Spotify playback opens its official app or website and may require internet access. Local music playback stays separate."
          />
        )}
      </View>
    </Shell>
  );
}
