import db from './db.js';

export const StoreModel = {
  async findByShop(shop) {
    if (db.usePostgres) {
      const result = await db.query('SELECT * FROM stores WHERE shop = $1', [shop]);
      return result.rows[0] || null;
    }
    return db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
  },

  async findById(id) {
    if (db.usePostgres) {
      const result = await db.query('SELECT * FROM stores WHERE id = $1', [id]);
      return result.rows[0] || null;
    }
    return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
  },

  async create(data) {
    if (db.usePostgres) {
      return db.query(
        'INSERT INTO stores (id, shop, access_token, scope) VALUES ($1, $2, $3, $4)',
        [data.id, data.shop, data.accessToken, data.scope]
      );
    }
    return db.prepare(
      'INSERT INTO stores (id, shop, access_token, scope) VALUES (?, ?, ?, ?)'
    ).run(data.id, data.shop, data.accessToken, data.scope);
  },

  async updateToken(shop, token) {
    if (db.usePostgres) {
      return db.query('UPDATE stores SET access_token = $1 WHERE shop = $2', [token, shop]);
    }
    return db.prepare('UPDATE stores SET access_token = ? WHERE shop = ?').run(token, shop);
  }
};
