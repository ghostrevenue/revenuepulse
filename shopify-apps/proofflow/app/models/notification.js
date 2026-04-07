/**
 * ProofFlow - Notification Model
 * Social proof notification operations
 */

import { getDb } from './db.js';

export function createNotification(notificationData) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO notifications (store_id, type, product_id, location, city, session_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    notificationData.store_id,
    notificationData.type,
    notificationData.product_id,
    notificationData.location || '',
    notificationData.city || '',
    notificationData.session_id || ''
  );
  
  return { id: result.lastInsertRowid, ...notificationData };
}

export function getNotifications(storeId, filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM notifications WHERE store_id = ?';
  const params = [storeId];
  
  if (filters.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  
  if (filters.product_id) {
    query += ' AND product_id = ?';
    params.push(filters.product_id);
  }
  
  if (filters.shown !== undefined) {
    query += ' AND shown = ?';
    params.push(filters.shown ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function markNotificationShown(notificationId) {
  const db = getDb();
  const stmt = db.prepare('UPDATE notifications SET shown = 1 WHERE id = ?');
  return stmt.run(notificationId);
}

export function getRecentPurchases(storeId, productId, limit = 10) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM notifications 
    WHERE store_id = ? AND type = 'purchase' AND product_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(storeId, productId, limit);
}

export function getActivePurchaseNotifications(storeId, productId, sessionId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM notifications 
    WHERE store_id = ? AND type = 'purchase' AND product_id = ?
    AND session_id != ? AND shown = 0
    AND created_at >= datetime('now', '-1 hour')
    ORDER BY RANDOM()
    LIMIT 1
  `);
  return stmt.get(storeId, productId, sessionId);
}

export function cleanupOldNotifications(storeId, hoursOld = 24) {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM notifications 
    WHERE store_id = ? AND created_at < datetime('now', '-' || ? || ' hours')
  `);
  return stmt.run(storeId, hoursOld);
}

export function getNotificationStats(storeId) {
  const db = getDb();
  
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE store_id = ?');
  const total = totalStmt.get(storeId).count;
  
  const shownStmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE store_id = ? AND shown = 1');
  const shown = shownStmt.get(storeId).count;
  
  const purchaseStmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE store_id = ? AND type = "purchase"');
  const purchases = purchaseStmt.get(storeId).count;
  
  const viewStmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE store_id = ? AND type = "view"');
  const views = viewStmt.get(storeId).count;
  
  return {
    total,
    shown,
    purchases,
    views,
    clickRate: total > 0 ? ((shown / total) * 100).toFixed(1) : 0
  };
}

export default {
  createNotification,
  getNotifications,
  markNotificationShown,
  getRecentPurchases,
  getActivePurchaseNotifications,
  cleanupOldNotifications,
  getNotificationStats
};
