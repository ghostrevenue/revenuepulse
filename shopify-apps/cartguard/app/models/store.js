import { getDB, uuid } from './db.js';

export function createStore(data) {
  const db = getDB();
  const id = data.id || uuid();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stores (id, shop, access_token, scope, billing_plan, settings)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.shop, data.access_token, data.scope || 'read_orders,write_orders,read_products', data.billing_plan || 'starter', JSON.stringify(data.settings || {}));
  return getStore(id);
}

export function getStore(id) {
  const db = getDB();
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  if (store && store.settings) store.settings = JSON.parse(store.settings);
  return store;
}

export function getStoreByShop(shop) {
  const db = getDB();
  const store = db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
  if (store && store.settings) store.settings = JSON.parse(store.settings);
  return store;
}

export function updateStore(id, data) {
  const db = getDB();
  const fields = [];
  const values = [];
  if (data.access_token !== undefined) { fields.push('access_token = ?'); values.push(data.access_token); }
  if (data.scope !== undefined) { fields.push('scope = ?'); values.push(data.scope); }
  if (data.billing_plan !== undefined) { fields.push('billing_plan = ?'); values.push(data.billing_plan); }
  if (data.billing_status !== undefined) { fields.push('billing_status = ?'); values.push(data.billing_status); }
  if (data.settings !== undefined) { fields.push('settings = ?'); values.push(JSON.stringify(data.settings)); }
  if (fields.length === 0) return getStore(id);
  values.push(id);
  db.prepare(`UPDATE stores SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getStore(id);
}

export function deleteStore(id) {
  const db = getDB();
  db.prepare('DELETE FROM stores WHERE id = ?').run(id);
}
