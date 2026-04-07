import express from 'express';

const router = express.Router();

const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    features: ['1,000 customers', 'Basic segments', 'RFM analysis', 'Email support']
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 49,
    features: ['Unlimited customers', 'Cohort analysis', 'Custom reports', 'API access', 'Priority support']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    features: ['Everything in Growth', 'Predictive churn scores', 'Full behavioral analysis', 'Dedicated support']
  }
};

// Get available plans
router.get('/plans', (req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

// Get current subscription
router.get('/subscription', (req, res) => {
  try {
    const subscription = req.db.prepare(`
      SELECT * FROM subscriptions WHERE store_id = ? AND status = 'active'
      ORDER BY started_at DESC LIMIT 1
    `).get(req.store.id);
    
    if (!subscription) {
      return res.json({ subscription: null, plan: null });
    }
    
    const plan = PLANS[subscription.plan];
    res.json({ subscription, plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create subscription (mock - in production integrates with Shopify Billing API)
router.post('/subscribe', (req, res) => {
  try {
    const { plan_id } = req.body;
    
    if (!PLANS[plan_id]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    // Check if already subscribed
    const existing = req.db.prepare(`
      SELECT * FROM subscriptions WHERE store_id = ? AND status = 'active'
    `).get(req.store.id);
    
    if (existing) {
      // Update existing
      req.db.prepare(`
        UPDATE subscriptions SET plan = ?, status = 'active'
        WHERE store_id = ? AND id = ?
      `).run(plan_id, req.store.id, existing.id);
    } else {
      // Create new
      req.db.prepare(`
        INSERT INTO subscriptions (store_id, plan, status)
        VALUES (?, ?, 'active')
      `).run(req.store.id, plan_id);
    }
    
    res.json({ 
      success: true, 
      message: `Subscribed to ${PLANS[plan_id].name} plan`,
      plan: PLANS[plan_id]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel', (req, res) => {
  try {
    req.db.prepare(`
      UPDATE subscriptions SET status = 'cancelled'
      WHERE store_id = ? AND status = 'active'
    `).run(req.store.id);
    
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
