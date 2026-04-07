/**
 * RevenuePulse - Database Models
 * SQLite database with better-sqlite3
 * 
 * Tables:
 * - stores: Shop installation records
 * - offers: Upsell offer configurations
 * - analytics_events: Event tracking for analytics
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path from environment or default
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/revenuepulse.db');

// Ensure data directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let db = null;

/**
 * Initialize the database connection and create tables
 */
export function initDatabase() {
  try {
    db = new Database(DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables
    createTables();
    
    console.log(`[Database] Initialized at ${DB_PATH}`);
    return db;
  } catch (error) {
    console.error('[Database] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export function getDb() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Create all database tables
 */
function createTables() {
  // Stores table - one record per installed shop
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

  // Offers table - upsell offer configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      trigger_config TEXT DEFAULT '{}',
      product_config TEXT DEFAULT '{}',
      display_config TEXT DEFAULT '{}',
      frequency_cap TEXT DEFAULT '{}',
      schedule TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  // Analytics events table - tracks all upsell interactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      offer_id INTEGER,
      order_id TEXT NOT NULL,
      customer_id TEXT,
      event_type TEXT NOT NULL,
      revenue REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
    )
  `);

  // Customer offer history - for frequency capping
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_offer_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      offer_id INTEGER NOT NULL,
      shown_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      clicked_at DATETIME,
      converted_at DATETIME,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
      UNIQUE(store_id, customer_id, offer_id, shown_at)
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_offers_store_id ON offers(store_id);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    CREATE INDEX IF NOT EXISTS idx_analytics_store_id ON analytics_events(store_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_offer_id ON analytics_events(offer_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_customer_history_customer ON customer_offer_history(customer_id);
  `);

  console.log('[Database] Tables created successfully');
}

// ============================================
// STORE OPERATIONS
// ============================================

/**
 * Create or update a store record
 */
export function upsertStore(shopDomain, accessToken, plan = 'starter', scope = '') {
  const stmt = db.prepare(`
    INSERT INTO stores (shop_domain, access_token, plan, scope, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(shop_domain) DO UPDATE SET
      access_token = excluded.access_token,
      plan = excluded.plan,
      scope = excluded.scope,
      updated_at = CURRENT_TIMESTAMP
    WHERE excluded.access_token != stores.access_token OR excluded.plan != stores.plan
  `);
  
  const result = stmt.run(shopDomain, accessToken, plan, scope);
  return { id: result.lastInsertRowid, shopDomain };
}

/**
 * Get store by domain
 */
export function getStore(shopDomain) {
  const stmt = db.prepare('SELECT * FROM stores WHERE shop_domain = ?');
  return stmt.get(shopDomain);
}

/**
 * Get store by ID
 */
export function getStoreById(storeId) {
  const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
  return stmt.get(storeId);
}

/**
 * Update store plan
 */
export function updateStorePlan(shopDomain, plan) {
  const stmt = db.prepare('UPDATE stores SET plan = ?, updated_at = CURRENT_TIMESTAMP WHERE shop_domain = ?');
  return stmt.run(plan, shopDomain);
}

/**
 * Delete store and all associated data (on uninstall)
 */
export function deleteStore(shopDomain) {
  const stmt = db.prepare('DELETE FROM stores WHERE shop_domain = ?');
  return stmt.run(shopDomain);
}

/**
 * Get all active stores
 */
export function getActiveStores() {
  const stmt = db.prepare('SELECT * FROM stores WHERE is_active = 1');
  return stmt.all();
}

// ============================================
// OFFER OPERATIONS
// ============================================

/**
 * Create a new offer
 */
export function createOffer(storeId, offerData) {
  const stmt = db.prepare(`
    INSERT INTO offers (store_id, name, description, status, trigger_config, product_config, display_config, frequency_cap, schedule)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    storeId,
    offerData.name,
    offerData.description || '',
    offerData.status || 'draft',
    JSON.stringify(offerData.trigger_config || {}),
    JSON.stringify(offerData.product_config || {}),
    JSON.stringify(offerData.display_config || {}),
    JSON.stringify(offerData.frequency_cap || {}),
    JSON.stringify(offerData.schedule || {})
  );
  
  return { id: result.lastInsertRowid, ...offerData };
}

/**
 * Get all offers for a store
 */
export function getOffers(storeId, status = null) {
  let query = 'SELECT * FROM offers WHERE store_id = ?';
  const params = [storeId];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  const offers = stmt.all(...params);
  
  // Parse JSON fields
  return offers.map(offer => ({
    ...offer,
    trigger_config: JSON.parse(offer.trigger_config || '{}'),
    product_config: JSON.parse(offer.product_config || '{}'),
    display_config: JSON.parse(offer.display_config || '{}'),
    frequency_cap: JSON.parse(offer.frequency_cap || '{}'),
    schedule: JSON.parse(offer.schedule || '{}')
  }));
}

/**
 * Get offer by ID
 */
export function getOffer(offerId) {
  const stmt = db.prepare('SELECT * FROM offers WHERE id = ?');
  const offer = stmt.get(offerId);
  
  if (!offer) return null;
  
  return {
    ...offer,
    trigger_config: JSON.parse(offer.trigger_config || '{}'),
    product_config: JSON.parse(offer.product_config || '{}'),
    display_config: JSON.parse(offer.display_config || '{}'),
    frequency_cap: JSON.parse(offer.frequency_cap || '{}'),
    schedule: JSON.parse(offer.schedule || '{}')
  };
}

/**
 * Get active offers for a store
 */
export function getActiveOffers(storeId) {
  const stmt = db.prepare(`
    SELECT * FROM offers 
    WHERE store_id = ? AND status = 'active'
    ORDER BY created_at DESC
  `);
  
  const offers = stmt.all(storeId);
  
  return offers.map(offer => ({
    ...offer,
    trigger_config: JSON.parse(offer.trigger_config || '{}'),
    product_config: JSON.parse(offer.product_config || '{}'),
    display_config: JSON.parse(offer.display_config || '{}'),
    frequency_cap: JSON.parse(offer.frequency_cap || '{}'),
    schedule: JSON.parse(offer.schedule || '{}')
  }));
}

/**
 * Update an offer
 */
export function updateOffer(offerId, offerData) {
  const fields = [];
  const values = [];
  
  if (offerData.name !== undefined) {
    fields.push('name = ?');
    values.push(offerData.name);
  }
  if (offerData.description !== undefined) {
    fields.push('description = ?');
    values.push(offerData.description);
  }
  if (offerData.status !== undefined) {
    fields.push('status = ?');
    values.push(offerData.status);
  }
  if (offerData.trigger_config !== undefined) {
    fields.push('trigger_config = ?');
    values.push(JSON.stringify(offerData.trigger_config));
  }
  if (offerData.product_config !== undefined) {
    fields.push('product_config = ?');
    values.push(JSON.stringify(offerData.product_config));
  }
  if (offerData.display_config !== undefined) {
    fields.push('display_config = ?');
    values.push(JSON.stringify(offerData.display_config));
  }
  if (offerData.frequency_cap !== undefined) {
    fields.push('frequency_cap = ?');
    values.push(JSON.stringify(offerData.frequency_cap));
  }
  if (offerData.schedule !== undefined) {
    fields.push('schedule = ?');
    values.push(JSON.stringify(offerData.schedule));
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(offerId);
  
  const stmt = db.prepare(`
    UPDATE offers SET ${fields.join(', ')} WHERE id = ?
  `);
  
  return stmt.run(...values);
}

/**
 * Delete an offer
 */
export function deleteOffer(offerId) {
  const stmt = db.prepare('DELETE FROM offers WHERE id = ?');
  return stmt.run(offerId);
}

/**
 * Duplicate an offer
 */
export function duplicateOffer(offerId, newName) {
  const original = getOffer(offerId);
  if (!original) {
    throw new Error('Offer not found');
  }
  
  return createOffer(original.store_id, {
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    status: 'draft',
    trigger_config: original.trigger_config,
    product_config: original.product_config,
    display_config: original.display_config,
    frequency_cap: original.frequency_cap,
    schedule: original.schedule
  });
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

/**
 * Track an analytics event
 */
export function trackAnalyticsEvent(eventData) {
  const { storeId, offerId, orderId, customerId, eventType, revenue = 0 } = eventData;
  
  const stmt = db.prepare(`
    INSERT INTO analytics_events (store_id, offer_id, order_id, customer_id, event_type, revenue)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(storeId, offerId, orderId, customerId, eventType, revenue);
  return { id: result.lastInsertRowid };
}

/**
 * Record customer offer history (for frequency capping)
 */
export function recordOfferHistory(historyData) {
  const { storeId, customerId, offerId, eventType } = historyData;
  
  // Get the most recent entry for this customer/offer
  const existingStmt = db.prepare(`
    SELECT * FROM customer_offer_history 
    WHERE store_id = ? AND customer_id = ? AND offer_id = ?
    ORDER BY shown_at DESC LIMIT 1
  `);
  
  const existing = existingStmt.get(storeId, customerId, offerId);
  
  if (eventType === 'shown') {
    // Always create a new shown entry
    const stmt = db.prepare(`
      INSERT INTO customer_offer_history (store_id, customer_id, offer_id, shown_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(storeId, customerId, offerId);
  } else if (eventType === 'clicked' && existing) {
    const stmt = db.prepare(`
      UPDATE customer_offer_history SET clicked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(existing.id);
  } else if (eventType === 'converted' && existing) {
    const stmt = db.prepare(`
      UPDATE customer_offer_history SET converted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(existing.id);
  }
  
  return null;
}

/**
 * Get customer's offer history count
 */
export function getCustomerOfferCount(storeId, customerId, offerId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM customer_offer_history
    WHERE store_id = ? AND customer_id = ? AND offer_id = ?
  `);
  return stmt.get(storeId, customerId, offerId).count;
}

/**
 * Get customer's last interaction time with an offer
 */
export function getCustomerLastInteraction(storeId, customerId, offerId) {
  const stmt = db.prepare(`
    SELECT MAX(shown_at) as last_shown, MAX(clicked_at) as last_clicked, MAX(converted_at) as last_converted
    FROM customer_offer_history
    WHERE store_id = ? AND customer_id = ? AND offer_id = ?
  `);
  return stmt.get(storeId, customerId, offerId);
}

/**
 * Get analytics summary for a store
 */
export function getAnalyticsSummary(storeId, startDate, endDate) {
  const stmt = db.prepare(`
    SELECT 
      event_type,
      COUNT(*) as count,
      SUM(revenue) as total_revenue
    FROM analytics_events
    WHERE store_id = ? AND created_at BETWEEN ? AND ?
    GROUP BY event_type
  `);
  
  return stmt.all(storeId, startDate, endDate);
}

/**
 * Get top performing offers
 */
export function getTopOffers(storeId, startDate, endDate, limit = 10) {
  const stmt = db.prepare(`
    SELECT 
      o.id,
      o.name,
      COUNT(CASE WHEN ae.event_type = 'shown' THEN 1 END) as impressions,
      COUNT(CASE WHEN ae.event_type = 'clicked' THEN 1 END) as clicks,
      COUNT(CASE WHEN ae.event_type = 'converted' THEN 1 END) as conversions,
      SUM(CASE WHEN ae.event_type = 'converted' THEN ae.revenue ELSE 0 END) as revenue
    FROM offers o
    LEFT JOIN analytics_events ae ON o.id = ae.offer_id AND ae.created_at BETWEEN ? AND ?
    WHERE o.store_id = ?
    GROUP BY o.id
    ORDER BY conversions DESC
    LIMIT ?
  `);
  
  return stmt.all(startDate, endDate, storeId, limit);
}

/**
 * Get funnel data (shown -> clicked -> converted)
 */
export function getFunnelData(storeId, startDate, endDate) {
  const stmt = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(CASE WHEN event_type = 'shown' THEN 1 END) as shown,
      COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked,
      COUNT(CASE WHEN event_type = 'converted' THEN 1 END) as converted
    FROM analytics_events
    WHERE store_id = ? AND created_at BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  
  return stmt.all(storeId, startDate, endDate);
}

/**
 * Get revenue analytics
 */
export function getRevenueAnalytics(storeId, startDate, endDate) {
  const stmt = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(revenue) as daily_revenue,
      COUNT(DISTINCT order_id) as orders_with_upsell,
      COUNT(DISTINCT customer_id) as customers
    FROM analytics_events
    WHERE store_id = ? AND event_type = 'converted' AND created_at BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  
  return stmt.all(storeId, startDate, endDate);
}

export default {
  initDatabase,
  getDb,
  upsertStore,
  getStore,
  getStoreById,
  updateStorePlan,
  deleteStore,
  getActiveStores,
  createOffer,
  getOffers,
  getOffer,
  getActiveOffers,
  updateOffer,
  deleteOffer,
  duplicateOffer,
  trackAnalyticsEvent,
  recordOfferHistory,
  getCustomerOfferCount,
  getCustomerLastInteraction,
  getAnalyticsSummary,
  getTopOffers,
  getFunnelData,
  getRevenueAnalytics
};
