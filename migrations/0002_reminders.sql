CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  subscription TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  origin TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS push_deliveries (
  subscription_id TEXT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  state TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (subscription_id, slot)
);
