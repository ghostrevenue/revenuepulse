import db from './db.js';

export const LocationModel = {
  findAll(storeId) {
    return db.prepare('SELECT * FROM locations WHERE store_id = ?').all(storeId);
  },
  findById(id) {
    return db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  },
  create(data) {
    const stmt = db.prepare('INSERT INTO locations (store_id, name, address) VALUES (?, ?, ?)');
    return stmt.run(data.storeId, data.name, data.address || null);
  },
  update(id, data) {
    const stmt = db.prepare('UPDATE locations SET name = ?, address = ? WHERE id = ?');
    return stmt.run(data.name, data.address, id);
  },
  delete(id) {
    return db.prepare('DELETE FROM locations WHERE id = ?').run(id);
  }
};