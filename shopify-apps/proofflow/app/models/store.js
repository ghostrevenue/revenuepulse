/**
 * ProofFlow - Store Model
 * Store operations for Shopify installations
 */

import { getDb } from './db.js';

export function upsertStore(shopDomain, accessToken, plan = 'starter', scope = '') {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO stores (shop_domain, access_token, plan, scope, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(shop_domain) DO UPDATE SET
      access_token = excluded.access_token,
      plan = excluded.plan,
      scope = excluded.scope,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  const result = stmt.run(shopDomain, accessToken, plan, scope);
  return { id: result.lastInsertRowid, shopDomain };
}

export function getStore(shopDomain) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM stores WHERE shop_domain = ?');
  return stmt.get(shopDomain);
}

export function getStoreById(storeId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
  return stmt.get(storeId);
}

export function updateStorePlan(shopDomain, plan) {
  const db = getDb();
  const stmt = db.prepare('UPDATE stores SET plan = ?, updated_at = CURRENT_TIMESTAMP WHERE shop_domain = ?');
  return stmt.run(plan, shopDomain);
}

export function deleteStore(shopDomain) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM stores WHERE shop_domain = ?');
  return stmt.run(shopDomain);
}

export function getActiveStores() {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM stores WHERE is_active = 1');
  return stmt.all();
}

export default {
  upsertStore,
  getStore,
  getStoreById,
  updateStorePlan,
  deleteStore,
  getActiveStores
};
