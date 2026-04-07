import db from './models/db.js';
import { v4 as uuidv4 } from 'uuid';

export const Referral = {
  create: ({ subscriberId, campaignId }) => {
    const id = uuidv4();
    const code = Referral.generateCode(subscriberId);
    const stmt = db.prepare(`
      INSERT INTO referrals (id, subscriber_id, campaign_id, code)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(id, subscriberId, campaignId, code);
  },

  generateCode: (subscriberId) => {
    const base = subscriberId.substring(0, 8).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${random}`;
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM referrals WHERE id = ?');
    return stmt.get(id);
  },

  findByCode: (code) => {
    const stmt = db.prepare('SELECT * FROM referrals WHERE code = ?');
    return stmt.get(code);
  },

  findBySubscriber: (subscriberId) => {
    const stmt = db.prepare('SELECT * FROM referrals WHERE subscriber_id = ?');
    return stmt.get(subscriberId);
  },

  findByCampaign: (campaignId) => {
    const stmt = db.prepare('SELECT * FROM referrals WHERE campaign_id = ?');
    return stmt.all(campaignId);
  },

  incrementClicks: (code) => {
    const stmt = db.prepare('UPDATE referrals SET click_count = click_count + 1 WHERE code = ?');
    return stmt.run(code);
  },

  incrementSignups: (code) => {
    const stmt = db.prepare('UPDATE referrals SET signup_count = signup_count + 1 WHERE code = ?');
    return stmt.run(code);
  },

  getTopReferrers: (campaignId, limit = 10) => {
    const stmt = db.prepare(`
      SELECT r.*, w.email, w.position
      FROM referrals r
      JOIN waitlist_subscribers w ON r.subscriber_id = w.id
      WHERE r.campaign_id = ?
      ORDER BY r.signup_count DESC
      LIMIT ?
    `);
    return stmt.all(campaignId, limit);
  },

  getStats: (campaignId) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(click_count) as total_clicks,
        SUM(signup_count) as total_referral_signups
      FROM referrals WHERE campaign_id = ?
    `);
    return stmt.get(campaignId);
  }
};
