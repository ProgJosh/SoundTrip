import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { SyncResponse, SyncRow } from "../src/core/sync";
import { SyncChange } from "../src/core/model";
import { validateChanges } from "./validation";
export interface MetadataRepository {
  sync(
    owner: string,
    changes: SyncChange[],
    cursor: number,
  ): Promise<SyncResponse>;
  delete(owner: string): Promise<void>;
}
export type VerifyIdentity = (token: string) => Promise<string>;
export class AccountDataDeleted extends Error {}
export function createApi(
  repository: MetadataRepository,
  verify: VerifyIdentity,
  allowedOrigin: string,
) {
  const app = new Hono<{ Variables: { owner: string } }>();
  app.use("*", secureHeaders());
  app.use(
    "*",
    cors({
      origin: allowedOrigin,
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "Content-Type"],
    }),
  );
  app.use(
    "*",
    bodyLimit({
      maxSize: 1024 * 1024,
      onError: (c) => c.json({ error: "Metadata batch too large." }, 413),
    }),
  );
  app.get("/health", (c) => c.json({ status: "ok", audioUploads: false }));
  app.use("*", async (c, next) => {
    if (c.req.path === "/health" || c.req.method === "OPTIONS") return next();
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer "))
      return c.json({ error: "Sign in to sync metadata." }, 401);
    try {
      const owner = await verify(header.slice(7));
      if (!owner) throw new Error();
      c.set("owner", owner);
    } catch {
      return c.json({ error: "Session expired. Sign in again." }, 401);
    }
    c.header("Cache-Control", "no-store");
    return next();
  });
  app.post("/sync", async (c) => {
    let changes: SyncChange[], cursor: number;
    try {
      const body = await c.req.json();
      changes = validateChanges(body.changes);
      cursor = body.cursor;
      if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error();
    } catch {
      return c.json({ error: "Invalid metadata sync request." }, 400);
    }
    try {
      return c.json(await repository.sync(c.get("owner"), changes, cursor));
    } catch (error) {
      if (error instanceof AccountDataDeleted)
        return c.json(
          {
            error:
              "Synced data was deleted. This account cannot upload it again.",
          },
          410,
        );
      throw error;
    }
  });
  app.delete("/account-data", async (c) => {
    await repository.delete(c.get("owner"));
    return c.json({ deleted: true });
  });
  app.onError((_e, c) =>
    c.json(
      {
        error:
          "Sync service is temporarily unavailable. Your local edits are safe.",
      },
      503,
    ),
  );
  return app;
}
// Test adapter. The production API never uses it or accepts test identities.
export class MemoryRepository implements MetadataRepository {
  rows = new Map<string, SyncRow>();
  operations = new Set<string>();
  revision = 0;
  deleted = new Set<string>();
  async sync(owner: string, changes: SyncChange[], cursor: number) {
    if (this.deleted.has(owner)) throw new AccountDataDeleted();
    for (const change of changes) {
      const op = `${owner}:${change.opId}`;
      if (this.operations.has(op)) continue;
      this.operations.add(op);
      const key = `${owner}:${change.entity}:${change.id}`;
      const old = this.rows.get(key);
      if (!old || old.updatedAt <= change.updatedAt)
        this.rows.set(key, {
          entity: change.entity,
          id: change.id,
          value: change.value,
          updatedAt: change.updatedAt,
          revision: ++this.revision,
        });
    }
    const touched = new Set(changes.map((c) => `${c.entity}:${c.id}`));
    const rows = [...this.rows.entries()]
      .filter(
        ([key, v]) =>
          key.startsWith(`${owner}:`) &&
          (v.revision > cursor || touched.has(`${v.entity}:${v.id}`)),
      )
      .map(([, v]) => v)
      .sort((a, b) => a.revision - b.revision);
    return {
      acknowledged: changes.map((c) => c.opId),
      rows,
      cursor: Math.max(cursor, rows.at(-1)?.revision || 0),
    };
  }
  async delete(owner: string) {
    this.deleted.add(owner);
    for (const key of this.rows.keys())
      if (key.startsWith(`${owner}:`)) this.rows.delete(key);
    for (const key of this.operations)
      if (key.startsWith(`${owner}:`)) this.operations.delete(key);
  }
}
