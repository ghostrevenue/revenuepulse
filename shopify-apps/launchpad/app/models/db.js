import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../../data/launchpad.db');
const dbDir = dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    domain TEXT UNIQUE NOT NULL,
    access_token TEXT,
    scope TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    product_id TEXT,
    name TEXT NOT NULL,
    headline TEXT,
    description TEXT,
    launch_date TEXT,
    status TEXT DEFAULT 'draft',
    signup_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS waitlist_subscribers (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    email TEXT NOT NULL,
    referred_by TEXT,
    position INTEGER,
    notified INTEGER DEFAULT 0,
    converted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (referred_by) REFERENCES waitlist_subscribers(id)
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    subscriber_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    click_count INTEGER DEFAULT 0,
    signup_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subscriber_id) REFERENCES waitlist_subscribers(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE INDEX IF NOT EXISTS idx_campaigns_store ON campaigns(store_id);
  CREATE INDEX IF NOT EXISTS idx_subscribers_campaign ON waitlist_subscribers(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_referrals_subscriber ON referrals(subscriber_id);
  CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
`);

export default db;
