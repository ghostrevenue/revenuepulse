import db from './db.js';

export const StoreModel = {
  findByShop(shop) {
    return db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
  },
  findById(id) {
    return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  },
  create(data) {
    const stmt = db.prepare('INSERT INTO stores (id, shop, access_token, scope) VALUES (?, ?, ?, ?)');
    return stmt.run(data.id, data.shop, data.accessToken, data.scope);
  },
  updateToken(shop, token) {
    return db.prepare('UPDATE stores SET access_token = ? WHERE shop = ?').run(token, shop);
  }
};