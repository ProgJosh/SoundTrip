import { getRandomValues, randomUUID } from "expo-crypto";

// The Neon client creates a tab identifier while its module loads. Hermes has
// no browser crypto global, so supply only the secure random functions it uses.
// This does not pretend to implement SubtleCrypto or replace browser crypto.
const nativeRandom = globalThis.crypto ?? {};
if (!("randomUUID" in nativeRandom))
  Object.defineProperty(nativeRandom, "randomUUID", { value: randomUUID });
if (!("getRandomValues" in nativeRandom))
  Object.defineProperty(nativeRandom, "getRandomValues", {
    value: getRandomValues,
  });
if (!globalThis.crypto)
  Object.defineProperty(globalThis, "crypto", {
    value: nativeRandom,
    configurable: true,
  });
