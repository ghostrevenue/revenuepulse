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

  // Persist to disk
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

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
