import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const domains = [
    ...new Set(
      [
        process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI,
        process.env.EXPO_PUBLIC_ACCOUNT_ORIGIN,
      ].flatMap((value) => {
        if (!value) return [];
        try {
          const url = new URL(value);
          return url.protocol === "https:" ? [url.hostname] : [];
        } catch {
          return [];
        }
      }),
    ),
  ];
  return {
    ...config,
    name: config.name || "SoundTrip",
    slug: config.slug || "soundtrip",
    ios: {
      ...config.ios,
      associatedDomains: domains.map((domain) => `applinks:${domain}`),
    },
    android: {
      ...config.android,
      intentFilters: domains.length
        ? [
            {
              action: "VIEW",
              autoVerify: true,
              category: ["BROWSABLE", "DEFAULT"],
              data: domains.map((host) => ({ scheme: "https", host })),
            },
          ]
        : [],
    },
  };
};
