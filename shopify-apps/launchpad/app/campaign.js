import db from './models/db.js';
import { v4 as uuidv4 } from 'uuid';

export const Campaign = {
  create: ({ storeId, productId, name, headline, description, launchDate, status = 'draft' }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO campaigns (id, store_id, product_id, name, headline, description, launch_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(id, storeId, productId, name, headline, description, launchDate, status);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM campaigns WHERE id = ?');
    return stmt.get(id);
  },

  findByStore: (storeId) => {
    const stmt = db.prepare('SELECT * FROM campaigns WHERE store_id = ? ORDER BY created_at DESC');
    return stmt.all(storeId);
  },

  update: (id, updates) => {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    const stmt = db.prepare(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM campaigns WHERE id = ?');
    return stmt.run(id);
  },

  incrementSignupCount: (id) => {
    const stmt = db.prepare('UPDATE campaigns SET signup_count = signup_count + 1 WHERE id = ?');
    return stmt.run(id);
  },

  listActive: () => {
    const stmt = db.prepare("SELECT * FROM campaigns WHERE status = 'active' ORDER BY launch_date ASC");
    return stmt.all();
  },

  getStats: (storeId) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(signup_count) as total_signups,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns
      FROM campaigns WHERE store_id = ?
    `);
    return stmt.get(storeId);
  }
};
