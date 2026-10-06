import { serve } from "@hono/node-server";
import { neon } from "@neondatabase/serverless";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AccountDataDeleted, createApi, MetadataRepository } from "./api";
import { SyncRow } from "../src/core/sync";
const databaseUrl = process.env.DATABASE_URL;
const authUrl = process.env.NEON_AUTH_BASE_URL;
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
if (!databaseUrl || !authUrl || !jwksUrl)
  throw new Error(
    "API requires DATABASE_URL, NEON_AUTH_BASE_URL and NEON_AUTH_JWKS_URL. See .env.example and README.",
  );
const sql = neon(databaseUrl);
const jwks = createRemoteJWKSet(new URL(jwksUrl));
const repository: MetadataRepository = {
  async sync(owner, changes, cursor) {
    const queries = [
      sql`INSERT INTO soundtrip_sync_guard(owner_id) VALUES(${owner}) ON CONFLICT DO NOTHING`,
      sql`SELECT owner_id,deleted FROM soundtrip_sync_guard WHERE owner_id=${owner} FOR UPDATE`,
    ];
    for (const change of changes)
      queries.push(sql`
      WITH accepted AS (INSERT INTO soundtrip_operations(owner_id,op_id) SELECT ${owner},${change.opId} FROM soundtrip_sync_guard WHERE owner_id=${owner} AND NOT deleted ON CONFLICT DO NOTHING RETURNING op_id)
      INSERT INTO soundtrip_metadata(owner_id,entity,entity_id,value,updated_at)
      SELECT ${owner},${change.entity},${change.id},${JSON.stringify(change.value)}::jsonb,${change.updatedAt} FROM accepted
      ON CONFLICT(owner_id,entity,entity_id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at,revision=DEFAULT
      WHERE soundtrip_metadata.updated_at<=excluded.updated_at`);
    const touched = changes.map((c) => c.id);
    queries.push(
      sql`SELECT entity,entity_id AS id,value,updated_at AS "updatedAt",revision FROM soundtrip_metadata WHERE owner_id=${owner} AND (revision>${cursor} OR entity_id=ANY(${touched}::text[])) ORDER BY revision LIMIT 1000`,
    );
    const results = await sql.transaction(queries);
    if (results[1]?.[0]?.deleted) throw new AccountDataDeleted();
    const rows = results.at(-1)!.map((r) => ({
      ...r,
      updatedAt: Number(r.updatedAt),
      revision: Number(r.revision),
    })) as SyncRow[];
    return {
      acknowledged: changes.map((c) => c.opId),
      rows,
      cursor: Math.max(cursor, rows.at(-1)?.revision || 0),
    };
  },
  async delete(owner) {
    await sql.transaction([
      sql`INSERT INTO soundtrip_sync_guard(owner_id,deleted) VALUES(${owner},true) ON CONFLICT(owner_id) DO UPDATE SET deleted=true`,
      sql`DELETE FROM soundtrip_metadata WHERE owner_id=${owner}`,
      sql`DELETE FROM soundtrip_operations WHERE owner_id=${owner}`,
    ]);
  },
};
const app = createApi(
  repository,
  async (token) => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: new URL(authUrl).origin,
      audience: new URL(authUrl).origin,
      algorithms: ["EdDSA"],
    });
    if (!payload.sub) throw new Error("Missing identity.");
    return payload.sub;
  },
  process.env.ALLOWED_ORIGIN || "http://127.0.0.1:8081",
);
serve({ fetch: app.fetch, port: Number(process.env.PORT || 8787) });
console.log("SoundTrip metadata API listening. Audio uploads are disabled.");
