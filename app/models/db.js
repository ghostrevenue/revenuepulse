import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usePostgres = !!process.env.DATABASE_URL;

let sqliteDb = null;
let pgPool = null;

if (!usePostgres) {
  const dbPath = path.join(__dirname, '../../revenuepulse.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('foreign_keys = ON');

  // Initialize SQLite tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      shop TEXT UNIQUE NOT NULL,
      access_token TEXT,
      scope TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
    );

    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS gdpr_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT,
      webhook_type TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      status TEXT DEFAULT 'received'
    );
  `);
} else {
  // PostgreSQL via Railway
  pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Initialize Postgres tables
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      shop TEXT UNIQUE NOT NULL,
      access_token TEXT,
      scope TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS revenue_data (
      id SERIAL PRIMARY KEY,
      store_id TEXT NOT NULL,
      date DATE NOT NULL,
      revenue REAL DEFAULT 0,
      orders INTEGER DEFAULT 0,
      average_order_value REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(store_id, date)
    );

    CREATE TABLE IF NOT EXISTS billing (
      id SERIAL PRIMARY KEY,
      store_id TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gdpr_logs (
      id SERIAL PRIMARY KEY,
      store_id TEXT,
      webhook_type TEXT,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      status TEXT DEFAULT 'received'
    );
  `).catch(() => {
    // Tables may already exist, ignore error
  });
}

// Unified query interface
export const db = {
  usePostgres,

  // SQLite: db.prepare().get()/all()/run()
  // Postgres: pool.query()
  query(sql, params = []) {
    if (usePostgres) {
      return pgPool.query(sql, params);
    } else {
      return sqliteDb.prepare(sql)[params.length > 0 ? 'get' : 'all'](params.length > 0 ? params : undefined);
    }
  },

  prepare(sql) {
    if (usePostgres) {
      return {
        get: (...params) => pgPool.query(sql, params).then(r => r.rows[0]),
        all: (...params) => pgPool.query(sql, params).then(r => r.rows),
        run: (...params) => pgPool.query(sql, params).then(r => ({ changes: r.rowCount }))
      };
    } else {
      return sqliteDb.prepare(sql);
    }
  },

  exec(sql) {
    if (usePostgres) {
      return pgPool.query(sql);
    } else {
      return sqliteDb.exec(sql);
    }
  }
};

export default db;
