import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../../flashfb.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    shop TEXT UNIQUE NOT NULL,
    access_token TEXT,
    fb_pixel_id TEXT,
    fb_access_token TEXT,
    scope TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pixel_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    pixel_id TEXT NOT NULL,
    access_token TEXT,
    test_event_id TEXT,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    event_id TEXT,
    event_name TEXT NOT NULL,
    event_source TEXT DEFAULT 'pixel',
    fbp TEXT,
    fbc TEXT,
    value REAL,
    currency TEXT,
    order_id TEXT,
    deduplicated INTEGER DEFAULT 0,
    payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS audiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    audience_type TEXT DEFAULT 'custom_audience',
    rules TEXT,
    size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    fb_audience_id TEXT,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS custom_conversions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    event_names TEXT,
    rules TEXT,
    count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'starter',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE INDEX IF NOT EXISTS idx_events_store ON events(store_id);
  CREATE INDEX IF NOT EXISTS idx_events_order ON events(order_id);
  CREATE INDEX IF NOT EXISTS idx_events_source ON events(event_source);
  CREATE INDEX IF NOT EXISTS idx_audiences_store ON audiences(store_id);
`);

export default db;
