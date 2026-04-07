import { getDb } from './db.js';

export const Plan = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO plans (store_id, name, description, frequency_days, discount_percent, min_remaining_orders)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.store_id, data.name, data.description, data.frequency_days,
      data.discount_percent, data.min_remaining_orders || 0
    );
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM plans WHERE id = ?');
    return stmt.get(id);
  },

  findByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM plans WHERE store_id = ? AND is_active = 1 ORDER BY created_at DESC');
    return stmt.all(storeId);
  },

  update(id, data) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE plans SET name = ?, description = ?, frequency_days = ?, 
      discount_percent = ?, min_remaining_orders = ? WHERE id = ?
    `);
    return stmt.run(data.name, data.description, data.frequency_days, 
                   data.discount_percent, data.min_remaining_orders, id);
  },

  deactivate(id) {
    const db = getDb();
    const stmt = db.prepare('UPDATE plans SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
  },

  countByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM plans WHERE store_id = ? AND is_active = 1');
    return stmt.get(storeId).count;
  }
};

export default Plan;
