# Cloudflare hosting

SoundTrip's Expo web export is hosted with Cloudflare Workers Static Assets. `wrangler.jsonc` deploys only `dist/`, uses SPA navigation fallback for Expo Router, and serves `/index.html` directly for the offline shell. The account ID is a public deployment identifier, not a credential.

Live app: **[soundtrip.joshua27emmanuel30.workers.dev](https://soundtrip.joshua27emmanuel30.workers.dev)**. Updated on 2026-10-06 with SoundTrip website icons; deployed version `ae9ac882-d1fb-43f0-b506-6c032dd6c367`, from code commit `ca6f6e6`.

## Run and deploy

Requires Node 24 and the dependencies pinned in `package-lock.json`:

```powershell
npm ci
npx wrangler login
npm run deploy:cloudflare:check
npm run preview:cloudflare
# After verification:
npm run deploy:cloudflare
```

`preview:cloudflare` runs the local Workers runtime on `http://127.0.0.1:8788`. Both deployment commands automatically run `build:cloudflare` using the custom build command in `wrangler.jsonc`. A deployment dry run builds/validates the app without publishing. `npm run build:web` and `npm run preview` still provide the existing local-development workflow.

On Windows, stop `preview:cloudflare` with Ctrl+C before rebuilding/deploying: its file watcher can lock `dist/` while Expo replaces that directory. If a Windows runtime package is missing after a partial dependency install, restore the pinned install with `npm ci --include=optional` before running builds.

The production build uses shell/CI build variables and an optional ignored `.env.production`, whose values override inherited settings. It disables Expo's automatic dotenv loading and omits loopback endpoints that Wrangler may inherit from development settings. Leave production public settings empty for local playback and Spotify export import. To enable optional services, copy `.env.production.example` to `.env.production` and configure valid public HTTPS URLs. Never put secrets in `EXPO_PUBLIC_*` values; they are compiled into the browser app.

## What is hosted

- Public web code, fonts, artwork assets, manifest and offline service worker.
- Local file import/playback, playlists, moods, timed lyrics and Spotify account-data export import run in the browser, with per-origin IndexedDB storage.
- Imported audio, library databases, playlist exports, OAuth tokens, `.env` files, native builds and `.local` media artifacts are not deployment assets. This hosting configuration does not enable cloud audio uploads.
- The existing `server/index.ts` Node metadata API is a separate service. This asset-only Worker does not run it. Production account sync requires a reachable HTTPS API and configured Neon Auth/trusted origins. Live Spotify OAuth independently requires registered credentials and its HTTPS callback. Both optional integrations remain disabled when their build settings are absent.

The new HTTPS origin has its own browser library. The localhost library remains at its original origin; import your original audio and downloaded playlist JSON at the hosted URL when needed. Browser storage eviction/private browsing/background-playback limitations still apply. Visit the published app online once before using its offline shell.

## Cache and asset controls

`public/_headers` sets revalidation for HTML, manifest and service-worker updates, and immutable caching for fingerprinted Expo bundles. `public/.assetsignore` excludes source maps and Expo build metadata from upload. The offline-shell generator excludes Cloudflare control files and caches the manifest with the other public app assets. No cross-origin OAuth-breaking opener policy is added.

The website favicon uses SoundTrip's existing lime pulse badge from `assets/soundtrip-icon.png`. `public/icons/` supplies 192px and 512px web app icons, a solid maskable icon and a 180px Apple touch icon. The generated manifest and HTML reference these assets; the offline cache includes them. Icon responses revalidate, and the offline cache version includes asset contents so replacing an icon refreshes cached artwork.

Verified this icon deployment with TypeScript, lint and a Cloudflare production dry run. On the live HTTPS site, all five icon responses matched the production build, returned image content types and revalidation headers, and decoded in an isolated Edge browser after network access was disabled and the app reloaded. Apple touch metadata and image dimensions were checked in the browser; installation on a physical Apple device was not tested.

## Deployments from Git

The repository is `https://github.com/ProgJosh/SoundTrip`, branch `master`. For Cloudflare Workers Builds, connect that repository to the `soundtrip` Worker and use:

- Root directory: repository root.
- Production branch: `master`.
- Build command: `npm ci`.
- Deploy command: `npm run deploy:cloudflare`.
- Node version: 24.
- Public build variables: optional `EXPO_PUBLIC_*` values from `.env.production.example`.

Cloudflare Git integration authorization must be completed in the account dashboard if it is not already connected. Wrangler publishing and Git pushing do not automatically create that integration. The direct CLI deployment workflow works independently of Git integration.

To add a custom domain later, use the Worker's **Settings → Domains & Routes** in Cloudflare and verify the target hostname. Keep using one stable origin for browser libraries. Do not redirect an unrelated existing site without confirming its intended domain.

Official references: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), [asset headers](https://developers.cloudflare.com/workers/static-assets/headers/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).
