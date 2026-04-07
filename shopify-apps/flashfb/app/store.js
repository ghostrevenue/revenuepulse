import db from './models/db.js';

export function getStore(shop) {
  return db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
}

export function getStoreById(id) {
  return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
}

export function createStore(store) {
  const { id, shop, access_token, fb_pixel_id, fb_access_token, scope } = store;
  db.prepare(`
    INSERT OR REPLACE INTO stores (id, shop, access_token, fb_pixel_id, fb_access_token, scope)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, shop, access_token, fb_pixel_id, fb_access_token, scope);
  return getStore(shop);
}

export function updateStore(id, updates) {
  const store = getStoreById(id);
  if (!store) return null;
  const { access_token, fb_pixel_id, fb_access_token, scope } = updates;
  db.prepare(`
    UPDATE stores SET access_token = ?, fb_pixel_id = ?, fb_access_token = ?, scope = ?
    WHERE id = ?
  `).run(access_token ?? store.access_token, fb_pixel_id ?? store.fb_pixel_id, 
          fb_access_token ?? store.fb_access_token, scope ?? store.scope, id);
  return getStoreById(id);
}
