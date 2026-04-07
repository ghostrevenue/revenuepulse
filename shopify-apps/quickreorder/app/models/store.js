import { getDb } from './db.js';

export const Store = {
  create(shop, accessToken, scope) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO stores (shop, access_token, scope) VALUES (?, ?, ?)
    `);
    return stmt.run(shop, accessToken, scope);
  },

  findByShop(shop) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM stores WHERE shop = ?');
    return stmt.get(shop);
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
    return stmt.get(id);
  },

  updateAccessToken(shop, accessToken) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE stores SET access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE shop = ?
    `);
    return stmt.run(accessToken, shop);
  }
};

export default Store;
