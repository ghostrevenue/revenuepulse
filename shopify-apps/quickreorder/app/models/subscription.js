import { getDb } from './db.js';

export const Subscription = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO subscriptions 
      (store_id, customer_id, plan_id, product_id, variant_id, quantity, frequency_days, status, next_billing_date, discount_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.store_id, data.customer_id, data.plan_id, data.product_id,
      data.variant_id, data.quantity || 1, data.frequency_days,
      data.status || 'active', data.next_billing_date, data.discount_percent || 0
    );
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM subscriptions WHERE id = ?');
    return stmt.get(id);
  },

  findByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC');
    return stmt.all(storeId);
  },

  findByCustomer(customerId, storeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ? AND store_id = ? ORDER BY created_at DESC');
    return stmt.all(customerId, storeId);
  },

  findActiveByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM subscriptions WHERE store_id = ? AND status = 'active' ORDER BY created_at DESC");
    return stmt.all(storeId);
  },

  updateStatus(id, status) {
    const db = getDb();
    const cancelledAt = status === 'cancelled' ? new Date().toISOString() : null;
    const stmt = db.prepare(`
      UPDATE subscriptions SET status = ?, cancelled_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(status, cancelledAt, id);
  },

  updateNextBillingDate(id, nextBillingDate) {
    const db = getDb();
    const stmt = db.prepare('UPDATE subscriptions SET next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(nextBillingDate, id);
  },

  updateDiscountPercent(id, discountPercent) {
    const db = getDb();
    const stmt = db.prepare('UPDATE subscriptions SET discount_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(discountPercent, id);
  },

  countByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ?');
    return stmt.get(storeId).count;
  },

  countActiveByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ? AND status = 'active'");
    return stmt.get(storeId).count;
  },

  countByStatus(storeId, status) {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ? AND status = ?');
    return stmt.get(storeId, status).count;
  },

  getNewSubsToday(storeId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE store_id = ? AND date(created_at) = date('now')
    `);
    return stmt.get(storeId).count;
  },

  getAgeDistribution(storeId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(created_at) < 30 THEN '0-30 days'
          WHEN julianday('now') - julianday(created_at) < 60 THEN '30-60 days'
          WHEN julianday('now') - julianday(created_at) < 90 THEN '60-90 days'
          ELSE '90+ days'
        END as age_bucket,
        COUNT(*) as count
      FROM subscriptions 
      WHERE store_id = ?
      GROUP BY age_bucket
    `);
    return stmt.all(storeId);
  }
};

export default Subscription;
