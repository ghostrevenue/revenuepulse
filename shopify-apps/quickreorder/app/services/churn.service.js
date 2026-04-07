import { getDb } from '../models/db.js';
import Subscription from '../models/subscription.js';
import SubscriptionOrder from '../models/order.js';

export const ChurnService = {
  detectChurn(storeId, daysThreshold = 14) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE store_id = ? AND status = 'active' 
      AND date(next_billing_date) < date('now', '-' || ? || ' days')
    `);
    return stmt.all(storeId, daysThreshold);
  },

  calculateChurnRate(storeId, days = 30) {
    const db = getDb();
    
    // Total active at start of period
    const startCount = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE store_id = ? AND created_at <= date('now', '-' || ? || ' days')
    `).get(storeId, days).count;
    
    // Cancelled in period
    const cancelledCount = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE store_id = ? AND status = 'cancelled' 
      AND cancelled_at >= date('now', '-' || ? || ' days')
    `).get(storeId, days).count;
    
    if (startCount === 0) return 0;
    return ((cancelledCount / startCount) * 100).toFixed(2);
  },

  getChurnTrend(storeId, months = 6) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', cancelled_at) as month,
        COUNT(*) as churned
      FROM subscriptions 
      WHERE store_id = ? AND status = 'cancelled'
      AND cancelled_at >= date('now', '-' || ? || ' months')
      GROUP BY strftime('%Y-%m', cancelled_at)
      ORDER BY month ASC
    `);
    return stmt.all(storeId, months);
  },

  getAtRiskSubscriptions(storeId) {
    // Subscriptions that haven't ordered in 2+ billing cycles
    const db = getDb();
    const stmt = db.prepare(`
      SELECT s.* FROM subscriptions s
      WHERE s.store_id = ? AND s.status = 'active'
      AND (
        SELECT COUNT(*) FROM subscription_orders so 
        WHERE so.subscription_id = s.id AND so.status = 'charged'
      ) = 0
      AND s.created_at < date('now', '-' || s.frequency_days || ' days')
    `);
    return stmt.all(storeId);
  },

  sendChurnWarning(customerId, storeId) {
    // Placeholder for email/notification
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO analytics_events (store_id, event_type, event_data)
      VALUES (?, 'churn_warning_sent', ?)
    `);
    stmt.run(storeId, JSON.stringify({ customer_id: customerId, sent_at: new Date().toISOString() }));
  },

  createWinBackOffer(subscriptionId, discountBump = 5) {
    const subscription = Subscription.findById(subscriptionId);
    if (!subscription) return null;
    
    const newDiscount = Math.min(subscription.discount_percent + discountBump, 30);
    Subscription.updateDiscountPercent(subscriptionId, newDiscount);
    
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO analytics_events (store_id, event_type, event_data)
      VALUES (?, 'win_back_offer', ?)
    `);
    stmt.run(subscription.store_id, JSON.stringify({ 
      subscription_id: subscriptionId, 
      new_discount: newDiscount 
    }));
    
    return { subscriptionId, newDiscount };
  },

  reactivateSubscription(id) {
    return Subscription.updateStatus(id, 'active');
  }
};

export default ChurnService;
