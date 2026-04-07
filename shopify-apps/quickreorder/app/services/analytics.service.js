import Subscription from '../models/subscription.js';
import SubscriptionOrder from '../models/order.js';
import { ChurnService } from './churn.service.js';

export const AnalyticsService = {
  getDashboardMetrics(storeId) {
    const activeSubs = Subscription.countActiveByStore(storeId);
    const churnRate = ChurnService.calculateChurnRate(storeId);
    const newToday = Subscription.getNewSubsToday(storeId);
    const totalRevenue = SubscriptionOrder.getTotalRevenue(storeId);
    const pendingOrders = SubscriptionOrder.findPendingByStore(storeId).length;
    
    return {
      activeSubscribers: activeSubs,
      churnRate: parseFloat(churnRate),
      newSubscribersToday: newToday,
      totalRevenue: totalRevenue,
      pendingOrders
    };
  },

  getMRR(storeId) {
    const db = require('../models/db.js').getDb();
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(
        (SELECT p.price FROM products p WHERE p.product_id = s.product_id LIMIT 1) * s.quantity * (1 - s.discount_percent / 100)
      ), 0) / s.frequency_days * 30 as mrr
      FROM subscriptions s
      WHERE s.store_id = ? AND s.status = 'active'
    `);
    const result = stmt.get(storeId);
    return result.mrr || 0;
  },

  getMRRTrend(storeId, months = 12) {
    const revenueData = SubscriptionOrder.getRevenueByMonth(storeId, months);
    
    // Calculate MRR as average monthly revenue
    const total = revenueData.reduce((sum, month) => sum + month.revenue, 0);
    const avgMrr = revenueData.length > 0 ? total / revenueData.length : 0;
    
    return {
      monthly: revenueData,
      average: avgMrr,
      current: revenueData.length > 0 ? revenueData[revenueData.length - 1].revenue : 0
    };
  },

  getLTV(storeId) {
    const db = require('../models/db.js').getDb();
    
    // Average revenue per subscriber
    const avgRevenue = db.prepare(`
      SELECT COALESCE(AVG(total_revenue), 0) as avg_revenue FROM (
        SELECT s.id, SUM(so.amount) as total_revenue
        FROM subscriptions s
        LEFT JOIN subscription_orders so ON s.id = so.subscription_id AND so.status = 'charged'
        WHERE s.store_id = ?
        GROUP BY s.id
      )
    `).get(storeId).avg_revenue;
    
    // Average subscription age in days
    const avgAge = db.prepare(`
      SELECT COALESCE(AVG(julianday('now') - julianday(created_at)), 0) as avg_age
      FROM subscriptions WHERE store_id = ?
    `).get(storeId).avg_age;
    
    // LTV = ARPU * Lifetime
    // Assuming average customer lifespan based on churn
    const churnRate = ChurnService.calculateChurnRate(storeId) / 100;
    const lifetime = churnRate > 0 ? 1 / churnRate * 30 : avgAge; // in days
    const ltv = avgRevenue * (lifetime / 30); // monthly equivalent
    
    return {
      averageRevenuePerSubscriber: avgRevenue,
      averageAgeDays: Math.round(avgAge),
      lifetimeMonths: (lifetime / 30).toFixed(1),
      ltv: ltv || 0
    };
  },

  getChurnFunnel(storeId) {
    const db = require('../models/db.js').getDb();
    
    const totalSubs = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ?
    `).get(storeId).count;
    
    const churnedSubs = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ? AND status = 'cancelled'
    `).get(storeId).count;
    
    const pausedSubs = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ? AND status = 'paused'
    `).get(storeId).count;
    
    const activeSubs = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ? AND status = 'active'
    `).get(storeId).count;
    
    const atRiskSubs = ChurnService.getAtRiskSubscriptions(storeId).length;
    
    return {
      total: totalSubs,
      active: activeSubs,
      paused: pausedSubs,
      churned: churnedSubs,
      atRisk: atRiskSubs,
      conversionRate: totalSubs > 0 ? ((activeSubs / totalSubs) * 100).toFixed(1) : 0
    };
  },

  getSubscriberGrowth(storeId, months = 12) {
    const db = require('../models/db.js').getDb();
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as new_subs
      FROM subscriptions 
      WHERE store_id = ? AND created_at >= date('now', '-' || ? || ' months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `);
    return stmt.all(storeId, months);
  },

  getAgeDistribution(storeId) {
    return Subscription.getAgeDistribution(storeId);
  },

  getPlanPerformance(storeId) {
    const db = require('../models/db.js').getDb();
    const stmt = db.prepare(`
      SELECT 
        p.id, p.name, p.frequency_days, p.discount_percent,
        COUNT(DISTINCT s.id) as subscriber_count,
        COALESCE(SUM(so.amount), 0) as total_revenue
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      LEFT JOIN subscription_orders so ON s.id = so.subscription_id AND so.status = 'charged'
      WHERE p.store_id = ?
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `);
    return stmt.all(storeId);
  },

  getFrequencyDistribution(storeId) {
    const db = require('../models/db.js').getDb();
    const stmt = db.prepare(`
      SELECT frequency_days, COUNT(*) as count
      FROM subscriptions 
      WHERE store_id = ? AND status = 'active'
      GROUP BY frequency_days
      ORDER BY count DESC
    `);
    return stmt.all(storeId);
  },

  getDunningMetrics(storeId) {
    const failedOrders = SubscriptionOrder.countByStatus(storeId, 'failed');
    const pendingOrders = SubscriptionOrder.countByStatus(storeId, 'pending');
    
    return {
      failedOrders,
      pendingOrders,
      retryRate: 0, // Would need historical data
      recoveryRate: 0
    };
  }
};

export default AnalyticsService;
