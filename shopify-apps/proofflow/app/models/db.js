/**
 * ProofFlow - Database Initialization
 * SQLite database with better-sqlite3
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/proofflow.db');

const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let db = null;

export function initDatabase() {
  try {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    createTables();
    console.log(`[Database] Initialized at ${DB_PATH}`);
    return db;
  } catch (error) {
    console.error('[Database] Failed to initialize:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

function createTables() {
  // Stores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_domain TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      plan TEXT DEFAULT 'starter',
      scope TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT,
      body TEXT,
      author_name TEXT NOT NULL,
      author_email TEXT,
      verified INTEGER DEFAULT 0,
      photos TEXT DEFAULT '[]',
      helpful_count INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      reply_text TEXT,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  // Notifications table (social proof)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('purchase', 'view')),
      product_id TEXT NOT NULL,
      location TEXT,
      city TEXT,
      session_id TEXT,
      shown INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  // Product settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      reviews_enabled INTEGER DEFAULT 1,
      widgets_enabled INTEGER DEFAULT 1,
      star_rating_enabled INTEGER DEFAULT 1,
      review_count_enabled INTEGER DEFAULT 1,
      live_counter_enabled INTEGER DEFAULT 1,
      purchase_popup_enabled INTEGER DEFAULT 1,
      auto_review_requests INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, product_id),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  // App settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER UNIQUE NOT NULL,
      email_subject TEXT DEFAULT 'Share your experience with us!',
      email_body TEXT DEFAULT 'Hi {{customer_name}},\n\nThank you for your recent purchase! We would love to hear about your experience with {{product_name}}.\n\nYour review helps other customers make informed decisions and helps us improve.\n\nLeave your review: {{review_link}}\n\nThank you for being a valued customer!',
      email_delay_days INTEGER DEFAULT 7,
      review_link_template TEXT,
      auto_requests_enabled INTEGER DEFAULT 1,
      max_requests_per_month INTEGER DEFAULT 100,
      minimum_rating_threshold INTEGER DEFAULT 1,
      hide_negative_reviews INTEGER DEFAULT 0,
      notification_style TEXT DEFAULT 'popup',
      notification_position TEXT DEFAULT 'bottom-left',
      notification_timeout INTEGER DEFAULT 5000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  // Analytics events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      product_id TEXT,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON notifications(product_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    CREATE INDEX IF NOT EXISTS idx_product_settings_store_id ON product_settings(store_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id ON analytics_events(store_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
  `);

  console.log('[Database] Tables created successfully');
}

export default { initDatabase, getDb };
