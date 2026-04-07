import { getDb } from '../models/db.js';

const PRICING = {
  starter: { price: 19, subscribers: 50, plans: 1, features: ['basic_analytics', '1_plan'] },
  growth: { price: 49, subscribers: 500, plans: 5, features: ['full_analytics', '5_plans', 'skip_delays'] },
  pro: { price: 99, subscribers: Infinity, plans: Infinity, features: ['full_analytics', 'unlimited_plans', 'dunning', 'priority_support'] }
};

export const BillingService = {
  getPricing() {
    return PRICING;
  },

  getPlanType(storeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT plan_type FROM billing WHERE store_id = ? AND status = ?');
    const billing = stmt.get(storeId, 'active');
    return billing ? billing.plan_type : 'starter';
  },

  canUsePlan(storeId, planType) {
    const currentPlan = this.getPlanType(storeId);
    const currentIndex = Object.keys(PRICING).indexOf(currentPlan);
    const requestedIndex = Object.keys(PRICING).indexOf(planType);
    return requestedIndex <= currentIndex + 1; // Can upgrade anytime, downgrade by 1 tier only
  },

  getSubscriberLimit(storeId) {
    const planType = this.getPlanType(storeId);
    return PRICING[planType].subscribers;
  },

  getPlanLimit(storeId) {
    const planType = this.getPlanType(storeId);
    return PRICING[planType].plans;
  },

  checkLimit(storeId, type) {
    const db = getDb();
    let count;
    
    if (type === 'subscribers') {
      const stmt = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE store_id = ? AND status = 'active'");
      count = stmt.get(storeId).count;
    } else if (type === 'plans') {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM plans WHERE store_id = ? AND is_active = 1');
      count = stmt.get(storeId).count;
    }
    
    const limit = type === 'subscribers' ? this.getSubscriberLimit(storeId) : this.getPlanLimit(storeId);
    
    return {
      count,
      limit,
      canAdd: count < limit
    };
  },

  upgradePlan(storeId, newPlanType) {
    if (!PRICING[newPlanType]) {
      return { success: false, error: 'Invalid plan type' };
    }
    
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO billing (store_id, plan_type, status) VALUES (?, ?, 'active')
      ON CONFLICT(store_id) DO UPDATE SET plan_type = ?, status = 'active'
    `);
    stmt.run(storeId, newPlanType, newPlanType);
    
    return { success: true, plan: newPlanType, price: PRICING[newPlanType].price };
  },

  cancelPlan(storeId) {
    const db = getDb();
    const stmt = db.prepare("UPDATE billing SET status = 'cancelled' WHERE store_id = ?");
    stmt.run(storeId);
    return { success: true };
  },

  calculateProration(storeId, newPlanType, daysRemaining) {
    const currentPlan = this.getPlanType(storeId);
    const currentPrice = PRICING[currentPlan].price;
    const newPrice = PRICING[newPlanType].price;
    const dailyRate = newPrice / 30;
    
    return {
      credit: currentPrice - (dailyRate * (30 - daysRemaining)),
      charge: newPrice,
      total: (newPrice - (currentPrice - (dailyRate * (30 - daysRemaining)))).toFixed(2)
    };
  },

  getFeatures(storeId) {
    const planType = this.getPlanType(storeId);
    return PRICING[planType].features;
  },

  hasFeature(storeId, feature) {
    const features = this.getFeatures(storeId);
    return features.includes(feature);
  }
};

export default BillingService;
