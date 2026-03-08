CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingested_at_ms INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  event_timestamp_ms INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  acquisition_json TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_ingested_at ON analytics_events(ingested_at_ms);
CREATE INDEX IF NOT EXISTS idx_analytics_player_id ON analytics_events(player_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
