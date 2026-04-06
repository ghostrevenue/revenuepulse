import db from './db.js';

export const StoreModel = {
  findByShop(shop) {
    if (db.usePostgres) {
      return db.prepare('SELECT * FROM stores WHERE shop = $1').get(shop);
    }
    return db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
  },

  findById(id) {
    if (db.usePostgres) {
      return db.prepare('SELECT * FROM stores WHERE id = $1').get(id);
    }
    return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  },

  create(data) {
    if (db.usePostgres) {
      return db.prepare(
        'INSERT INTO stores (id, shop, access_token, scope) VALUES ($1, $2, $3, $4)'
      ).run(data.id, data.shop, data.accessToken, data.scope);
    }
    return db.prepare(
      'INSERT INTO stores (id, shop, access_token, scope) VALUES (?, ?, ?, ?)'
    ).run(data.id, data.shop, data.accessToken, data.scope);
  },

  updateToken(shop, token) {
    if (db.usePostgres) {
      return db.prepare('UPDATE stores SET access_token = $1 WHERE shop = $2').run(token, shop);
    }
    return db.prepare('UPDATE stores SET access_token = ? WHERE shop = ?').run(token, shop);
  }
};
