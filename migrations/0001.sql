CREATE TABLE weeks (
  week TEXT PRIMARY KEY,
  generated_at TEXT NOT NULL,
  engine TEXT NOT NULL
);
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  week TEXT NOT NULL REFERENCES weeks(week),
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_items_week ON items(week);
