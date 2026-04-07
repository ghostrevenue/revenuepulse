import db from './models/db.js';

export function saveEvent(event) {
  const { store_id, event_id, event_name, event_source, fbp, fbc, value, currency, order_id, deduplicated, payload } = event;
  const result = db.prepare(`
    INSERT INTO events (store_id, event_id, event_name, event_source, fbp, fbc, value, currency, order_id, deduplicated, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(store_id, event_id, event_name, event_source, fbp, fbc, value, currency, order_id, deduplicated ? 1 : 0, payload);
  return result.lastInsertRowid;
}

export function getEventsByStore(storeId, limit = 100) {
  return db.prepare('SELECT * FROM events WHERE store_id = ? ORDER BY created_at DESC LIMIT ?').all(storeId, limit);
}

export function getEventsByOrder(storeId, orderId) {
  return db.prepare('SELECT * FROM events WHERE store_id = ? AND order_id = ?').all(storeId, orderId);
}

export function getEventStats(storeId, date = null) {
  const where = date ? 'WHERE store_id = ? AND DATE(created_at) = DATE(?)' : 'WHERE store_id = ?';
  const params = date ? [storeId, date] : [storeId];
  
  return db.prepare(`
    SELECT 
      event_name,
      COUNT(*) as count,
      SUM(value) as total_value,
      SUM(deduplicated) as deduplicated_count
    FROM events ${where}
    GROUP BY event_name
  `).all(...params);
}

export function getTodayStats(storeId) {
  return db.prepare(`
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT event_id) as unique_events,
      SUM(CASE WHEN deduplicated = 1 THEN 1 ELSE 0 END) as deduplicated,
      SUM(value) as total_value
    FROM events
    WHERE store_id = ? AND DATE(created_at) = DATE('now')
  `).get(storeId);
}
