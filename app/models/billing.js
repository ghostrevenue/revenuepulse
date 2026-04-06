import db from './db.js';

export const BillingModel = {
  async findByStore(storeId) {
    if (db.usePostgres) {
      const result = await db.query('SELECT * FROM billing WHERE store_id = $1', [storeId]);
      return result.rows[0] || null;
    }
    return db.prepare('SELECT * FROM billing WHERE store_id = ?').get(storeId);
  },

  async upsert(storeId, plan, status = 'active') {
    if (db.usePostgres) {
      return db.query(`
        INSERT INTO billing (store_id, plan, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (store_id) DO UPDATE SET
          plan = EXCLUDED.plan,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
      `, [storeId, plan, status]);
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
