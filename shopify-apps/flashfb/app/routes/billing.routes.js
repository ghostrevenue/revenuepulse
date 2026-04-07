import express from 'express';
import db from '../models/db.js';

const router = express.Router();

const PLANS = {
  starter: { price: 19, name: 'Starter', pixels: 1, custom_conversions: 5 },
  growth: { price: 49, name: 'Growth', pixels: 5, custom_conversions: 50, audience_sync: true, capi: true, analytics: true },
  pro: { price: 99, name: 'Pro', pixels: -1, custom_conversions: -1, lookalike: true, full_roas: true }
};

router.get('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const billing = db.prepare('SELECT * FROM billing WHERE store_id = ?').get(storeId);
  
  if (!billing) {
    return res.json({ plan: 'starter', ...PLANS.starter });
  }

  res.json({
    plan: billing.plan,
    status: billing.status,
    ...PLANS[billing.plan]
  });
});

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

router.post('/:storeId/activate', (req, res) => {
  const { storeId } = req.params;
  const { plan } = req.body;

  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  db.prepare(`
    INSERT OR REPLACE INTO billing (store_id, plan, status)
    VALUES (?, ?, 'active')
  `).run(storeId, plan);

  res.json({ success: true, plan, ...PLANS[plan] });
});

export default router;
