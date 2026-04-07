import { getDb } from './db.js';

export const SubscriptionOrder = {
  create(data) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO subscription_orders (subscription_id, order_id, status, amount, charged_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.subscription_id, data.order_id, data.status || 'pending',
      data.amount, data.charged_at
    );
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM subscription_orders WHERE id = ?');
    return stmt.get(id);
  },

  findBySubscription(subscriptionId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM subscription_orders WHERE subscription_id = ? ORDER BY created_at DESC');
    return stmt.all(subscriptionId);
  },

  findByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT so.*, s.customer_id, s.product_id, p.name as plan_name
      FROM subscription_orders so
      JOIN subscriptions s ON so.subscription_id = s.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.store_id = ?
      ORDER BY so.created_at DESC
    `);
    return stmt.all(storeId);
  },

  findPendingByStore(storeId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT so.*, s.customer_id, s.product_id, s.next_billing_date
      FROM subscription_orders so
      JOIN subscriptions s ON so.subscription_id = s.id
      WHERE s.store_id = ? AND so.status = 'pending'
      ORDER BY so.created_at ASC
    `);
    return stmt.all(storeId);
  },

  updateStatus(id, status, chargedAt = null) {
    const db = getDb();
    const stmt = db.prepare('UPDATE subscription_orders SET status = ?, charged_at = ? WHERE id = ?');
    return stmt.run(status, chargedAt, id);
  },

  countByStatus(storeId, status) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM subscription_orders so
      JOIN subscriptions s ON so.subscription_id = s.id
      WHERE s.store_id = ? AND so.status = ?
    `);
    return stmt.get(storeId, status).count;
  },

  getTotalRevenue(storeId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM subscription_orders so
      JOIN subscriptions s ON so.subscription_id = s.id
      WHERE s.store_id = ? AND so.status = 'charged'
    `);
    return stmt.get(storeId).total;
  },

  getMonthlyRevenue(storeId, year, month) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM subscription_orders so
      JOIN subscriptions s ON so.subscription_id = s.id
      WHERE s.store_id = ? AND so.status = 'charged' 
      AND strftime('%Y', charged_at) = ? AND strftime('%m', charged_at) = ?
    `);
    return stmt.get(storeId, year.toString(), month.toString().padStart(2, '0')).total;
  },

  getRevenueByMonth(storeId, months = 12) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', charged_at) as month,
        COALESCE(SUM(amount), 0) as revenue
      FROM subscription_orders so
      JOIN subscriptions s ON so.subscription_id = s.id
      WHERE s.store_id = ? AND so.status = 'charged'
      AND charged_at >= date('now', '-' || ? || ' months')
      GROUP BY strftime('%Y-%m', charged_at)
      ORDER BY month ASC
    `);
    return stmt.all(storeId, months);
  }
};

export default SubscriptionOrder;
