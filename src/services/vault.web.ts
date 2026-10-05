// Browser tokens intentionally live only in memory. Reload requires reconnecting.
const vault = new Map<string, string>();
export async function getSecret(key: string) { return vault.get(key) ?? null; }
export async function setSecret(key: string, value: string) { vault.set(key, value); }
export async function removeSecret(key: string) { vault.delete(key); }
