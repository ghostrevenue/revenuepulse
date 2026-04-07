import db from './db.js';

export const SupplierModel = {
  findAll(storeId) {
    return db.prepare('SELECT * FROM suppliers WHERE store_id = ?').all(storeId);
  },
  findById(id) {
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  },
  create(data) {
    const stmt = db.prepare('INSERT INTO suppliers (store_id, name, email, phone, lead_time_days, minimum_order) VALUES (?, ?, ?, ?, ?, ?)');
    return stmt.run(data.storeId, data.name, data.email || null, data.phone || null, data.leadTimeDays || 7, data.minimumOrder || 0);
  },
  update(id, data) {
    const stmt = db.prepare('UPDATE suppliers SET name = ?, email = ?, phone = ?, lead_time_days = ?, minimum_order = ? WHERE id = ?');
    return stmt.run(data.name, data.email, data.phone, data.leadTimeDays, data.minimumOrder, id);
  },
  delete(id) {
    return db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  }
};