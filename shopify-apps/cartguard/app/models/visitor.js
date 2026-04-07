import { getDB, uuid } from './db.js';

export function createVisitor(data) {
  const db = getDB();
  const id = data.id || uuid();
  const stmt = db.prepare(`
    INSERT INTO visitors (id, store_id, session_id, email, phone, cart_contents, cart_value, status, source, campaign_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.store_id,
    data.session_id,
    data.email || null,
    data.phone || null,
    JSON.stringify(data.cart_contents || []),
    data.cart_value || 0,
    data.status || 'browsing',
    data.source || null,
    data.campaign_id || null
  );
  return getVisitor(id);
}

export function getVisitor(id) {
  const db = getDB();
  const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(id);
  if (visitor && visitor.cart_contents) visitor.cart_contents = JSON.parse(visitor.cart_contents);
  return visitor;
}

export function getVisitors(storeId, options = {}) {
  const db = getDB();
  let sql = 'SELECT * FROM visitors WHERE store_id = ?';
  const params = [storeId];
  
  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }
  if (options.email) {
    sql += ' AND email IS NOT NULL';
  }
  
  sql += ' ORDER BY captured_at DESC';
  
  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }
  
  const rows = db.prepare(sql).all(...params);
  return rows.map(row => {
    if (row.cart_contents) row.cart_contents = JSON.parse(row.cart_contents);
    return row;
  });
}

export function getVisitorCount(storeId, status) {
  const db = getDB();
  let sql = 'SELECT COUNT(*) as count FROM visitors WHERE store_id = ?';
  const params = [storeId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  return db.prepare(sql).get(...params).count;
}

export function updateVisitor(id, data) {
  const db = getDB();
  const fields = [];
  const values = [];
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.cart_contents !== undefined) { fields.push('cart_contents = ?'); values.push(JSON.stringify(data.cart_contents)); }
  if (data.cart_value !== undefined) { fields.push('cart_value = ?'); values.push(data.cart_value); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.campaign_id !== undefined) { fields.push('campaign_id = ?'); values.push(data.campaign_id); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  if (fields.length === 0) return getVisitor(id);
  values.push(id);
  db.prepare(`UPDATE visitors SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getVisitor(id);
}

export function getOrCreateVisitor(storeId, sessionId) {
  const db = getDB();
  let visitor = db.prepare('SELECT * FROM visitors WHERE store_id = ? AND session_id = ? ORDER BY captured_at DESC LIMIT 1')
    .get(storeId, sessionId);
  if (!visitor) {
    visitor = createVisitor({ store_id: storeId, session_id: sessionId });
  }
  if (visitor && visitor.cart_contents) visitor.cart_contents = JSON.parse(visitor.cart_contents);
  return visitor;
}
