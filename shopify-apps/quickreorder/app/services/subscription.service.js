import Subscription from '../models/subscription.js';
import SubscriptionOrder from '../models/order.js';
import Plan from '../models/plan.js';

export const SubscriptionService = {
  createSubscription(data) {
    const nextBillingDate = this.calculateNextBillingDate(data.frequency_days);
    return Subscription.create({
      ...data,
      next_billing_date: nextBillingDate
    });
  },

  calculateNextBillingDate(frequencyDays, fromDate = new Date()) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + frequencyDays);
    return date.toISOString();
  },

  pauseSubscription(id) {
    return Subscription.updateStatus(id, 'paused');
  },

  resumeSubscription(id) {
    const subscription = Subscription.findById(id);
    if (!subscription) return null;
    const nextBillingDate = this.calculateNextBillingDate(subscription.frequency_days);
    Subscription.updateNextBillingDate(id, nextBillingDate);
    return Subscription.updateStatus(id, 'active');
  },

  cancelSubscription(id) {
    return Subscription.updateStatus(id, 'cancelled');
  },

  skipNextDelivery(id) {
    const subscription = Subscription.findById(id);
    if (!subscription) return null;
    
    const nextBillingDate = this.calculateNextBillingDate(subscription.frequency_days, subscription.next_billing_date);
    Subscription.updateNextBillingDate(id, nextBillingDate);
    
    // Mark current pending order as skipped
    const pendingOrders = SubscriptionOrder.findBySubscription(id).filter(o => o.status === 'pending');
    if (pendingOrders.length > 0) {
      SubscriptionOrder.updateStatus(pendingOrders[0].id, 'skipped');
    }
    
    return Subscription.findById(id);
  },

  changePlan(subscriptionId, newPlanId) {
    const plan = Plan.findById(newPlanId);
    if (!plan) return null;
    
    const subscription = Subscription.findById(subscriptionId);
    if (!subscription) return null;
    
    const nextBillingDate = this.calculateNextBillingDate(plan.frequency_days);
    Subscription.updateNextBillingDate(subscriptionId, nextBillingDate);
    
    const db = require('../models/db.js').getDb();
    const stmt = db.prepare(`
      UPDATE subscriptions SET plan_id = ?, frequency_days = ?, 
      discount_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(newPlanId, plan.frequency_days, plan.discount_percent, subscriptionId);
    
    return Subscription.findById(subscriptionId);
  },

  updateQuantity(id, quantity) {
    const db = require('../models/db.js').getDb();
    const stmt = db.prepare('UPDATE subscriptions SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(quantity, id);
  },

  getSubscriptionWithDetails(id) {
    const subscription = Subscription.findById(id);
    if (!subscription) return null;
    
    const plan = subscription.plan_id ? Plan.findById(subscription.plan_id) : null;
    const orders = SubscriptionOrder.findBySubscription(id);
    
    return {
      ...subscription,
      plan,
      orders
    };
  },

  getRetentionDiscount(subscriptionId) {
    const subscription = Subscription.findById(subscriptionId);
    if (!subscription) return 0;
    
    const createdAt = new Date(subscription.created_at);
    const now = new Date();
    const daysActive = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    // Discount tiers based on tenure
    if (daysActive >= 365) return 20; // 20% for 1+ year
    if (daysActive >= 180) return 15; // 15% for 6+ months
    if (daysActive >= 90) return 10;  // 10% for 3+ months
    if (daysActive >= 30) return 5;   // 5% for 1+ month
    return 0;
  },

  applyRetentionDiscount(subscriptionId) {
    const discount = this.getRetentionDiscount(subscriptionId);
    if (discount > 0) {
      Subscription.updateDiscountPercent(subscriptionId, discount);
    }
    return discount;
  }
};

export default SubscriptionService;
