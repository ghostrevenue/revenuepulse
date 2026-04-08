import initSqlJs from 'sql.js';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usePostgres = !!process.env.DATABASE_URL;

let sqliteDb = null;
let pgPool = null;
let dbReady = null;

// Initialize sql.js (pure JS/WASM, no native deps)
async function initSqlite() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '../../revenuepulse.db');
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');

  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      shop TEXT UNIQUE NOT NULL,
      access_token TEXT,
      scope TEXT,
      upsell_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS revenue_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      date DATE NOT NULL,
      revenue REAL DEFAULT 0,
      orders INTEGER DEFAULT 0,
      average_order_value REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, date),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS gdpr_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT,
      webhook_type TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      status TEXT DEFAULT 'received'
    )
  `);

  // Upsell offers table
  db.run(`
    CREATE TABLE IF NOT EXISTS upsell_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      offer_type TEXT NOT NULL DEFAULT 'add_product',
      trigger_min_amount REAL DEFAULT 0,
      trigger_max_amount REAL DEFAULT 0,
      trigger_product_ids TEXT,
      upsell_product_id TEXT,
      upsell_discount_code TEXT,
      upsell_discount_value REAL,
      headline TEXT,
      message TEXT,
      active INTEGER DEFAULT 1,
      -- A/B testing fields
      ab_variant_group_id TEXT,
      traffic_split INTEGER DEFAULT 100,
      -- Fallback sequence
      fallback_for_offer_id INTEGER,
      -- Status: draft | published | archived
      status TEXT DEFAULT 'draft',
      -- Rich targeting
      target_type TEXT DEFAULT 'any',
      include_product_ids TEXT,
      include_collection_ids TEXT,
      include_tags TEXT,
      exclude_product_ids TEXT,
      exclude_collection_ids TEXT,
      exclude_tags TEXT,
      target_first_time_customer INTEGER DEFAULT 0,
      target_customer_tags TEXT,
      target_collection_ids TEXT,
      accept_path_items TEXT,
      decline_path_items TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Upsell responses table
  db.run(`
    CREATE TABLE IF NOT EXISTS upsell_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      offer_id INTEGER,
      response TEXT NOT NULL,
      offer_type TEXT,
      added_revenue REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // A/B test groups table
  db.run(`
    CREATE TABLE IF NOT EXISTS upsell_ab_groups (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      offer_ids TEXT NOT NULL,
      winner_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // Persist to disk
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  // ── SQLite Migrations: add columns to existing tables ────────────────────────
  // These run AFTER table creation; IF NOT EXISTS won't add columns
  function addColIfMissing(table, col, type, defaultVal) {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      if (defaultVal !== undefined) {
        // SQLite doesn't support ADD COLUMN with DEFAULT, update existing rows
        db.run(`UPDATE ${table} SET ${col} = ${defaultVal} WHERE ${col} IS NULL`);
      }
    } catch (e) {
      // Column may already exist — ignore
    }
  }

  addColIfMissing('upsell_offers', 'status', 'TEXT', "'draft'");
  addColIfMissing('upsell_offers', 'target_type', 'TEXT', "'any'");
  addColIfMissing('upsell_offers', 'include_product_ids', 'TEXT', null);
  addColIfMissing('upsell_offers', 'include_collection_ids', 'TEXT', null);
  addColIfMissing('upsell_offers', 'include_tags', 'TEXT', null);
  addColIfMissing('upsell_offers', 'exclude_product_ids', 'TEXT', null);
  addColIfMissing('upsell_offers', 'exclude_collection_ids', 'TEXT', null);
  addColIfMissing('upsell_offers', 'exclude_tags', 'TEXT', null);
  addColIfMissing('upsell_offers', 'target_first_time_customer', 'INTEGER', 0);
  addColIfMissing('upsell_offers', 'target_customer_tags', 'TEXT', null);
  addColIfMissing('upsell_offers', 'trigger_max_amount', 'REAL', 0);
  addColIfMissing('upsell_offers', 'target_collection_ids', 'TEXT', null);
  addColIfMissing('upsell_offers', 'ab_variant_group_id', 'TEXT', null);
  addColIfMissing('upsell_offers', 'traffic_split', 'INTEGER', 100);
  addColIfMissing('upsell_offers', 'fallback_for_offer_id', 'INTEGER', null);
  addColIfMissing('upsell_responses', 'added_revenue', 'REAL', 0);
  addColIfMissing('stores', 'upsell_config', 'TEXT', null);
  addColIfMissing('upsell_offers', 'accept_path_items', 'TEXT', null);
  addColIfMissing('upsell_offers', 'decline_path_items', 'TEXT', null);
  addColIfMissing('stores', 'scope', 'TEXT', null);
  addColIfMissing('stores', 'access_token', 'TEXT', null);
  addColIfMissing('stores', 'created_at', 'DATETIME', "datetime('now')");

  // Persist after migrations
  const data2 = db.export();
  const buffer2 = Buffer.from(data2);
  fs.writeFileSync(dbPath, buffer2);

  return db;
}

async function initPostgres() {
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Initialize tables (ignore if exist)
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      shop TEXT UNIQUE NOT NULL,
      access_token TEXT,
      scope TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS revenue_data (
      id SERIAL PRIMARY KEY,
      store_id TEXT NOT NULL,
      date DATE NOT NULL,
      revenue REAL DEFAULT 0,
      orders INTEGER DEFAULT 0,
      average_order_value REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, date)
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS billing (
      id SERIAL PRIMARY KEY,
      store_id TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS gdpr_logs (
      id SERIAL PRIMARY KEY,
      store_id TEXT,
      webhook_type TEXT,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      status TEXT DEFAULT 'received'
    )
  `);

  // Upsell offers table
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS upsell_offers (
      id SERIAL PRIMARY KEY,
      store_id TEXT NOT NULL,
      offer_type TEXT NOT NULL DEFAULT 'add_product',
      trigger_min_amount REAL DEFAULT 0,
      trigger_max_amount REAL DEFAULT 0,
      trigger_product_ids TEXT,
      upsell_product_id TEXT,
      upsell_discount_code TEXT,
      upsell_discount_value REAL,
      headline TEXT,
      message TEXT,
      active INTEGER DEFAULT 1,
      ab_variant_group_id UUID,
      traffic_split INTEGER DEFAULT 100,
      fallback_for_offer_id UUID,
      -- Status: draft | published | archived
      status TEXT DEFAULT 'draft',
      -- Rich targeting
      target_type TEXT DEFAULT 'any',
      include_product_ids TEXT,
      include_collection_ids TEXT,
      include_tags TEXT,
      exclude_product_ids TEXT,
      exclude_collection_ids TEXT,
      exclude_tags TEXT,
      target_first_time_customer INTEGER DEFAULT 0,
      target_customer_tags TEXT,
      target_collection_ids TEXT,
      accept_path_items JSONB,
      decline_path_items JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Upsell responses table
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS upsell_responses (
      id SERIAL PRIMARY KEY,
      store_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      offer_id UUID,
      response TEXT NOT NULL,
      offer_type TEXT,
      added_revenue DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // A/B test groups table
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS upsell_ab_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id TEXT NOT NULL,
      offer_ids UUID[] NOT NULL,
      winner_id UUID,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: add new columns to existing upsell_offers table
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN ab_variant_group_id UUID;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN traffic_split INTEGER DEFAULT 100;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN fallback_for_offer_id UUID;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Migration: add new columns to existing upsell_responses table
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_responses ADD COLUMN added_revenue DECIMAL(10,2) DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Add upsell_config column to stores if it doesn't exist
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE stores ADD COLUMN upsell_config JSONB;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // ── Rich Targeting & Offer Status migrations ───────────────────────────────
  // Status field
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN status TEXT DEFAULT 'draft';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Target type
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN target_type TEXT DEFAULT 'any';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Include arrays
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN include_product_ids TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN include_collection_ids TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN include_tags TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Exclude arrays
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN exclude_product_ids TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN exclude_collection_ids TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN exclude_tags TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Customer targeting
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN target_first_time_customer INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN target_customer_tags TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Order conditions
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN trigger_max_amount REAL DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN target_collection_ids TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Accept/Decline path items (multi-item flow)
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN accept_path_items JSONB;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  await pgPool.query(`
    DO $$ BEGIN
      ALTER TABLE upsell_offers ADD COLUMN decline_path_items JSONB;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
}

// Sync init on module load — kicks off async init
if (usePostgres) {
  dbReady = initPostgres();
} else {
  dbReady = initSqlite();
}

// Persist sqlite periodically
function persistSqlite() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    const dbPath = path.join(__dirname, '../../revenuepulse.db');
    fs.writeFileSync(dbPath, buffer);
  }
}

// Unify query interface for both backends
const db = {
  usePostgres,

  async ensureReady() {
    await dbReady;
  },

  // For postgres: returns pg query result
  // For sqlite: returns array of rows (sync)
  query(sql, params = []) {
    if (usePostgres) {
      return pgPool.query(sql, params);
    } else {
      // sql.js is sync — run and return rows
      const stmt = sqliteDb.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    }
  },

  // Prepared statement interface
  prepare(sql) {
    if (usePostgres) {
      return {
        get: (...params) => pgPool.query(sql, params).then(r => r.rows[0]),
        all: (...params) => pgPool.query(sql, params).then(r => r.rows),
        run: (...params) => pgPool.query(sql, params).then(r => ({ changes: r.rowCount }))
      };
    } else {
      return {
        get: (...params) => {
          const stmt = sqliteDb.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : null;
          stmt.free();
          return row;
        },
        all: (...params) => {
          const stmt = sqliteDb.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        run: (...params) => {
          sqliteDb.run(sql, params);
          persistSqlite();
          return { changes: sqliteDb.getRowsModified() };
        }
      };
    }
  },

  exec(sql) {
    if (usePostgres) {
      return pgPool.query(sql);
    } else {
      sqliteDb.run(sql);
      persistSqlite();
    }
  },

  // Close connections
  async close() {
    if (sqliteDb) {
      persistSqlite();
      sqliteDb.close();
    }
    if (pgPool) await pgPool.end();
  }
};

export default db;
