-- Funnels: top-level post-purchase upsell flows
CREATE TABLE IF NOT EXISTS funnels (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Funnel',
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | active | archived
  trigger_json TEXT,  -- JSON string of Trigger object
  nodes_json TEXT,    -- JSON string of OfferNode[]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Funnel analytics events
CREATE TABLE IF NOT EXISTS funnel_events (
  id TEXT PRIMARY KEY,
  funnel_id TEXT NOT NULL,
  node_id TEXT,
  event_type TEXT NOT NULL,  -- impression | accept | decline
  amount REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE
);

-- Index for fast funnel lookups
CREATE INDEX IF NOT EXISTS idx_funnels_store ON funnels(store_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel ON funnel_events(funnel_id);
