import { getDB, uuid } from './db.js';

export function createCoupon(data) {
  const db = getDB();
  const id = data.id || uuid();
  const stmt = db.prepare(`
    INSERT INTO coupons (id, store_id, code, type, value, min_cart_value, max_uses, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.store_id,
    data.code,
    data.type || 'percentage',
    data.value || 0,
    data.min_cart_value || 0,
    data.max_uses || null,
    data.expires_at || null
  );
  return getCoupon(id);
}

export function getCoupon(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
}

export function getCoupons(storeId, activeOnly = true) {
  const db = getDB();
  let sql = 'SELECT * FROM coupons WHERE store_id = ?';
  if (activeOnly) sql += ' AND active = 1';
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(storeId);
}

export function getCouponByCode(storeId, code) {
  const db = getDB();
  return db.prepare('SELECT * FROM coupons WHERE store_id = ? AND code = ? AND active = 1').get(storeId, code);
}

export function updateCoupon(id, data) {
  const db = getDB();
  const fields = [];
  const values = [];
  if (data.code !== undefined) { fields.push('code = ?'); values.push(data.code); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.value !== undefined) { fields.push('value = ?'); values.push(data.value); }
  if (data.min_cart_value !== undefined) { fields.push('min_cart_value = ?'); values.push(data.min_cart_value); }
  if (data.max_uses !== undefined) { fields.push('max_uses = ?'); values.push(data.max_uses); }
  if (data.expires_at !== undefined) { fields.push('expires_at = ?'); values.push(data.expires_at); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }
  if (fields.length === 0) return getCoupon(id);
  values.push(id);
  db.prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCoupon(id);
}

export function incrementCouponUsage(id) {
  const db = getDB();
  db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(id);
}

export function deleteCoupon(id) {
  const db = getDB();
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
}
