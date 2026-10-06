import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
async function migrate() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("Set DATABASE_URL_UNPOOLED for migrations.");
  const sql = neon(url);
  const statements = readFileSync("server/schema.sql", "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((s) => sql.query(s)));
  console.log("SoundTrip schema is ready.");
}
void migrate();
