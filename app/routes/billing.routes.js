import express from 'express';
import { BillingModel } from '../models/billing.js';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// Single plan — $20/mo
export const PLAN = {
  name: 'Pro',
  price: 20,
  planKey: 'pro',
  features: ['Unlimited upsell funnels', 'A/B testing', 'Real-time analytics', 'Priority support'],
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
  res.json({
    plan: PLAN,
    status: billing?.status || 'active',
    store_id: req.store.id,
    shop: req.store.shop
  });
});

// Subscribe to plan — activate billing
router.post('/plan', verifySession, async (req, res) => {
  // Always activate the single $20/mo plan
  await BillingModel.upsert(req.store.id, 'pro', 'active');
  res.json({
    success: true,
    plan: PLAN,
    message: `Subscribed to ${PLAN.name} plan ($${PLAN.price}/mo)`,
  });
});

// Get all available plans
router.get('/plans', (req, res) => {
  res.json({ plans: { pro: PLAN } });
});

// DELETE /api/billing/uninstall — uninstall the app from the store
router.delete('/uninstall', verifySession, async (req, res) => {
  try {
    // Delete billing record
    await BillingModel.delete(req.store.id);
    // Mark store as uninstalled
    await StoreModel.update(req.store.id, { is_active: false, uninstalled_at: new Date().toISOString() });
    res.json({ success: true, message: 'App uninstalled successfully' });
  } catch (e) {
    console.error('[/billing/uninstall]', e.message);
    res.status(500).json({ error: 'Uninstall failed' });
  }
});

function getAppUrl() {
  let url = process.env.APP_URL || 'https://revenuepulse-production.up.railway.app';
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  return url;
}

// Shopify Billing API: Create recurring charge
// In production, this would call Shopify's Billing API:
// POST /admin/api/2024-01/recurring_application_charges.json
router.post('/charges', verifySession, async (req, res) => {
  const appUrl = getAppUrl();

  // Shopify recurring charge structure — single $20/mo plan
  const charge = {
    name: `PostPurchasePro ${PLAN.name}`,
    price: PLAN.price,
    interval: 'every_30_days',
    return_url: `${appUrl}/billing/callback`,
    terms: PLAN.features.join(', ')
  };

  // In production: POST to Shopify Billing API
  // For now: return mock charge URL
  res.json({
    charge,
    confirmation_url: `${appUrl}/billing/confirmed?plan=pro&store=${req.store.shop}`,
    note: 'Production: would create Shopify recurring_application_charge'
  });
});

export default router;
