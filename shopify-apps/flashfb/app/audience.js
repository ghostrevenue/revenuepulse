import db from './models/db.js';

export function createAudience(audience) {
  const { store_id, name, audience_type, rules, fb_audience_id } = audience;
  const result = db.prepare(`
    INSERT INTO audiences (store_id, name, audience_type, rules, fb_audience_id, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(store_id, name, audience_type || 'custom_audience', rules, fb_audience_id);
  return result.lastInsertRowid;
}

export function getAudiencesByStore(storeId) {
  return db.prepare('SELECT * FROM audiences WHERE store_id = ? ORDER BY created_at DESC').all(storeId);
}

export function getAudienceById(id) {
  return db.prepare('SELECT * FROM audiences WHERE id = ?').get(id);
}

export function updateAudience(id, updates) {
  const { name, rules, status, size, synced_at } = updates;
  db.prepare(`
    UPDATE audiences SET name = ?, rules = ?, status = ?, size = ?, synced_at = ?
    WHERE id = ?
  `).run(name, rules, status, size, synced_at, id);
  return getAudienceById(id);
}

export function deleteAudience(id) {
  return db.prepare('DELETE FROM audiences WHERE id = ?').run(id);
}

export function updateAudienceSize(id, size) {
  return db.prepare('UPDATE audiences SET size = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?').run(size, id);
}
