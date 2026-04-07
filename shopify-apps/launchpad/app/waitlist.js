import db from './models/db.js';
import { v4 as uuidv4 } from 'uuid';

export const WaitlistSubscriber = {
  create: ({ campaignId, email, referredBy = null }) => {
    const id = uuidv4();
    const position = WaitlistSubscriber.getNextPosition(campaignId);
    const stmt = db.prepare(`
      INSERT INTO waitlist_subscribers (id, campaign_id, email, referred_by, position)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(id, campaignId, email, referredBy, position);
  },

  getNextPosition: (campaignId) => {
    const stmt = db.prepare('SELECT MAX(position) as max_pos FROM waitlist_subscribers WHERE campaign_id = ?');
    const result = stmt.get(campaignId);
    return (result.max_pos || 0) + 1;
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM waitlist_subscribers WHERE id = ?');
    return stmt.get(id);
  },

  findByEmail: (campaignId, email) => {
    const stmt = db.prepare('SELECT * FROM waitlist_subscribers WHERE campaign_id = ? AND email = ?');
    return stmt.get(campaignId, email);
  },

  findByCampaign: (campaignId) => {
    const stmt = db.prepare('SELECT * FROM waitlist_subscribers WHERE campaign_id = ? ORDER BY position ASC');
    return stmt.all(campaignId);
  },

  countByCampaign: (campaignId) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM waitlist_subscribers WHERE campaign_id = ?');
    return stmt.get(campaignId).count;
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
    const stmt = db.prepare(`UPDATE waitlist_subscribers SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  },

  markNotified: (id) => {
    const stmt = db.prepare('UPDATE waitlist_subscribers SET notified = 1 WHERE id = ?');
    return stmt.run(id);
  },

  markConverted: (id) => {
    const stmt = db.prepare('UPDATE waitlist_subscribers SET converted = 1 WHERE id = ?');
    return stmt.run(id);
  },

  search: (campaignId, query) => {
    const stmt = db.prepare(`
      SELECT * FROM waitlist_subscribers 
      WHERE campaign_id = ? AND email LIKE ?
      ORDER BY position ASC
    `);
    return stmt.all(campaignId, `%${query}%`);
  },

  getReferralStats: (campaignId) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT referred_by) as referred_count,
        SUM(CASE WHEN referred_by IS NOT NULL THEN 1 ELSE 0 END) as referral_signups
      FROM waitlist_subscribers WHERE campaign_id = ?
    `);
    return stmt.get(campaignId);
  }
};
