CREATE TABLE IF NOT EXISTS soundtrip_metadata (
  owner_id TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('track', 'playlist', 'settings')),
  entity_id TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at BIGINT NOT NULL,
  revision BIGINT GENERATED ALWAYS AS IDENTITY,
  PRIMARY KEY (owner_id, entity, entity_id)
);
CREATE INDEX IF NOT EXISTS soundtrip_metadata_owner_revision ON soundtrip_metadata(owner_id, revision);
CREATE TABLE IF NOT EXISTS soundtrip_operations (
  owner_id TEXT NOT NULL,
  op_id TEXT NOT NULL,
  PRIMARY KEY (owner_id, op_id)
);
CREATE TABLE IF NOT EXISTS soundtrip_sync_guard (owner_id TEXT PRIMARY KEY);
ALTER TABLE soundtrip_sync_guard ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
