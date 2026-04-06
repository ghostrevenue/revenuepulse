import db from './db.js';

export const BillingModel = {
  findByStore(storeId) {
    if (db.usePostgres) {
      return db.prepare('SELECT * FROM billing WHERE store_id = $1').get(storeId);
    }
    return db.prepare('SELECT * FROM billing WHERE store_id = ?').get(storeId);
  },

  upsert(storeId, plan, status = 'active') {
    if (db.usePostgres) {
      return db.prepare(`
        INSERT INTO billing (store_id, plan, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (store_id) DO UPDATE SET
          plan = EXCLUDED.plan,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
      `).run(storeId, plan, status);
    }
    return db.prepare(`
      INSERT INTO billing (store_id, plan, status)
      VALUES (?, ?, ?)
      ON CONFLICT(store_id) DO UPDATE SET
        plan = excluded.plan,
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `).run(storeId, plan, status);
  }
};
