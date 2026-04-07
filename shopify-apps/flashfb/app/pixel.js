import db from './models/db.js';

export function getPixelConfig(storeId) {
  return db.prepare('SELECT * FROM pixel_configs WHERE store_id = ? AND enabled = 1').get(storeId);
}

export function getAllPixels(storeId) {
  return db.prepare('SELECT * FROM pixel_configs WHERE store_id = ?').all(storeId);
}

export function savePixelConfig(config) {
  const { store_id, pixel_id, access_token, test_event_id, enabled } = config;
  const existing = db.prepare('SELECT id FROM pixel_configs WHERE store_id = ? AND pixel_id = ?')
    .get(store_id, pixel_id);
  
  if (existing) {
    db.prepare(`
      UPDATE pixel_configs SET access_token = ?, test_event_id = ?, enabled = ?
      WHERE store_id = ? AND pixel_id = ?
    `).run(access_token, test_event_id, enabled ?? 1, store_id, pixel_id);
    return existing.id;
  }
  
  const result = db.prepare(`
    INSERT INTO pixel_configs (store_id, pixel_id, access_token, test_event_id, enabled)
    VALUES (?, ?, ?, ?, ?)
  `).run(store_id, pixel_id, access_token, test_event_id, enabled ?? 1);
  return result.lastInsertRowid;
}

export function deletePixelConfig(storeId, pixelId) {
  return db.prepare('DELETE FROM pixel_configs WHERE store_id = ? AND pixel_id = ?').run(storeId, pixelId);
}
