import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_NAME || 'quickreorder.db';

let db;

export function getDb() {
  if (!db) {
    db = new Database(join(__dirname, '..', '..', DB_PATH));
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initializeDatabase() {
  const db = getDb();

  // Stores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop TEXT UNIQUE NOT NULL,
      access_token TEXT,
      scope TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      frequency_days INTEGER NOT NULL,
      discount_percent REAL NOT NULL,
      min_remaining_orders INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      plan_id INTEGER,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      quantity INTEGER DEFAULT 1,
      frequency_days INTEGER NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
      next_billing_date DATETIME,
      discount_percent REAL DEFAULT 0,
      cancelled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    )
  `);

  // Subscription orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      order_id TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'charged', 'shipped', 'failed', 'skipped')),
      amount REAL,
      charged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    )
  `);

  // Billing table
  db.exec(`
    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      plan_type TEXT NOT NULL CHECK(plan_type IN ('starter', 'growth', 'pro')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'past_due')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Analytics events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  console.log('Database initialized successfully');
  return db;
}

export default { getDb, initializeDatabase };
