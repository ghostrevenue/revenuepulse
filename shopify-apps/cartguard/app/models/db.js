import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

let db = null;

export function initDB(dbPath) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  createTables();
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      shop TEXT UNIQUE NOT NULL,
      access_token TEXT,
      scope TEXT,
      installed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      billing_plan TEXT DEFAULT 'starter',
      billing_status TEXT DEFAULT 'active',
      settings TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('exit-intent', 'abandoned-cart', 'price-threshold', 'email-capture')),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused')),
      trigger_config TEXT DEFAULT '{}',
      offer_config TEXT DEFAULT '{}',
      display_config TEXT DEFAULT '{}',
      stats TEXT DEFAULT '{"impressions":0,"conversions":0,"revenue":0}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      session_id TEXT,
      email TEXT,
      phone TEXT,
      cart_contents TEXT DEFAULT '[]',
      cart_value REAL DEFAULT 0,
      status TEXT DEFAULT 'browsing' CHECK(status IN ('browsing', 'abandoned', 'recovered', 'converted')),
      source TEXT,
      campaign_id TEXT,
      captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed', 'free-shipping')),
      value REAL DEFAULT 0,
      min_cart_value REAL DEFAULT 0,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      expires_at TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      visitor_id TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (visitor_id) REFERENCES visitors(id)
    );

    CREATE TABLE IF NOT EXISTS billing (
      id TEXT PRIMARY KEY,
      store_id TEXT UNIQUE NOT NULL,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      billing_id TEXT,
      next_billing_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);
}

export function uuid() {
  return uuidv4();
}
