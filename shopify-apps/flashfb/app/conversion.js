import db from './models/db.js';

export function createConversion(conversion) {
  const { store_id, name, event_names, rules } = conversion;
  const result = db.prepare(`
    INSERT INTO custom_conversions (store_id, name, event_names, rules)
    VALUES (?, ?, ?, ?)
  `).run(store_id, name, event_names, rules);
  return result.lastInsertRowid;
}

export function getConversionsByStore(storeId) {
  return db.prepare('SELECT * FROM custom_conversions WHERE store_id = ? ORDER BY created_at DESC').all(storeId);
}

export function getConversionById(id) {
  return db.prepare('SELECT * FROM custom_conversions WHERE id = ?').get(id);
}

export function updateConversion(id, updates) {
  const { name, event_names, rules } = updates;
  db.prepare(`
    UPDATE custom_conversions SET name = ?, event_names = ?, rules = ?
    WHERE id = ?
  `).run(name, event_names, rules, id);
  return getConversionById(id);
}

export function deleteConversion(id) {
  return db.prepare('DELETE FROM custom_conversions WHERE id = ?').run(id);
}

export function incrementConversionCount(id) {
  return db.prepare('UPDATE custom_conversions SET count = count + 1 WHERE id = ?').run(id);
}
