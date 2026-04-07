import db from './models/db.js';
import { v4 as uuidv4 } from 'uuid';

export const Store = {
  create: (id, domain, accessToken, scope) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO stores (id, domain, access_token, scope)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(id, domain, accessToken, scope);
  },

  findByDomain: (domain) => {
    const stmt = db.prepare('SELECT * FROM stores WHERE domain = ?');
    return stmt.get(domain);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
    return stmt.get(id);
  },

  updateToken: (domain, accessToken) => {
    const stmt = db.prepare('UPDATE stores SET access_token = ? WHERE domain = ?');
    return stmt.run(accessToken, domain);
  }
};
