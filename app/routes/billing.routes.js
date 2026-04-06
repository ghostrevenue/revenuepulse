import express from 'express';
import { BillingModel } from '../models/billing.js';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// Shopify Billing API — plan definitions
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    features: ['30-day revenue history', 'daily summaries', 'email reports'],
    planKey: 'starter'
  },
  growth: {
    name: 'Growth',
    price: 49,
    features: ['90-day revenue history', 'real-time alerts', 'export to CSV', 'custom date ranges'],
    planKey: 'growth'
  },
  pro: {
    name: 'Pro',
    price: 99,
    features: ['unlimited history', 'API access', 'webhook integrations', 'priority support', 'multi-store'],
    planKey: 'pro'
  }
};

// Middleware: verify session token and extract store (async)
async function verifySession(req, res, next) {
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const storeId = req.headers['x-store-id'];

  await db.ensureReady();

  if (shopDomain) {
    const store = await StoreModel.findByShop(shopDomain);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    req.store = store;
  } else if (storeId) {
    const store = await StoreModel.findById(storeId);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    req.store = store;
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Get current plan
router.get('/plan', verifySession, async (req, res) => {
  const billing = await BillingModel.findByStore(req.store.id);
  const plan = billing ? PLANS[billing.plan] : PLANS.starter;

  res.json({
    plan,
    status: billing?.status || 'trial',
    store_id: req.store.id,
    shop: req.store.shop
  });
});

// Update plan — initiate Shopify billing charge
router.post('/plan', verifySession, async (req, res) => {
  const { plan: planKey } = req.body;

  if (!PLANS[planKey]) {
    return res.status(400).json({ error: 'Invalid plan. Choose: starter, growth, or pro' });
  }

  const plan = PLANS[planKey];

  // In production: create Shopify billing charge via Billing API
  // For now: update local billing record
  await BillingModel.upsert(req.store.id, planKey, 'active');

  res.json({
    success: true,
    plan,
    message: `Subscribed to ${plan.name} plan ($${plan.price}/mo)`,
    // In production: include confirmation_url from Shopify
    confirmation_url: `${process.env.APP_URL}/billing/confirmed?plan=${planKey}`
  });
});

// Get all available plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Shopify Billing API: Create recurring charge
// In production, this would call Shopify's Billing API:
// POST /admin/api/2024-01/recurring_application_charges.json
router.post('/charges', verifySession, async (req, res) => {
  const { plan: planKey } = req.body;
  if (!PLANS[planKey]) return res.status(400).json({ error: 'Invalid plan' });

  const plan = PLANS[planKey];

  // Shopify recurring charge structure
  const charge = {
    name: `RevenuePulse ${plan.name}`,
    price: plan.price,
    interval: 'every_30_days',
    return_url: `${process.env.APP_URL}/billing/callback`,
    terms: `Revenue analytics dashboard - ${plan.features.join(', ')}`
  };

  // In production: POST to Shopify Billing API
  // For now: return mock charge URL
  res.json({
    charge,
    confirmation_url: `${process.env.APP_URL}/billing/confirmed?plan=${planKey}&store=${req.store.shop}`,
    note: 'Production: would create Shopify recurring_application_charge'
  });
});

export default router;
