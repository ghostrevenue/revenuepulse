import db from './db.js';

export const AlertModel = {
  findAll(storeId) {
    return db.prepare('SELECT * FROM alerts WHERE store_id = ? ORDER BY created_at DESC').all(storeId);
  },
  create(data) {
    const stmt = db.prepare('INSERT INTO alerts (store_id, product_id, threshold, alert_type, sent_at) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(data.storeId, data.productId || null, data.threshold || 0, data.alertType || 'low_stock', data.sentAt || new Date().toISOString());
  },
  acknowledge(id) {
    return db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(id);
  },
  getUnacknowledged(storeId) {
    return db.prepare('SELECT * FROM alerts WHERE store_id = ? AND acknowledged = 0 ORDER BY created_at DESC').all(storeId);
  },
  getConfigs(storeId) {
    return db.prepare('SELECT * FROM alert_configs WHERE store_id = ?').all(storeId);
  },
  createConfig(data) {
    const stmt = db.prepare('INSERT INTO alert_configs (store_id, product_id, global, threshold, alert_type, email, sms, webhook_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    return stmt.run(data.storeId, data.productId || null, data.global || 0, data.threshold || 10, data.alertType || 'low_stock', data.email || null, data.sms || 0, data.webhookUrl || null);
  },
  updateConfig(id, data) {
    const stmt = db.prepare('UPDATE alert_configs SET threshold = ?, email = ?, sms = ?, webhook_url = ? WHERE id = ?');
    return stmt.run(data.threshold, data.email, data.sms, data.webhookUrl, id);
  }
};