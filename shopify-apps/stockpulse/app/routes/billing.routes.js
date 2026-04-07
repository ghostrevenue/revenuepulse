import express from 'express';
import db from '../models/db.js';

const router = express.Router();

const PLANS = {
  starter: { name: 'Starter', price: 19, products: 100, features: ['100 products', 'email alerts', 'basic analytics'] },
  growth: { name: 'Growth', price: 49, products: -1, features: ['unlimited products', 'SMS alerts', 'predictions', 'suppliers'] },
  pro: { name: 'Pro', price: 99, products: -1, features: ['auto-reorder', 'multi-location', 'full analytics', 'priority support'] }
};

// Get current plan
router.get('/plan', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const billing = db.prepare('SELECT * FROM billing WHERE store_id = ? ORDER BY created_at DESC LIMIT 1').get(storeId);
  const plan = billing ? PLANS[billing.plan] : PLANS.starter;
  
  res.json({ plan, status: billing?.status || 'trial' });
});

// Update plan
router.post('/plan', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { plan } = req.body;
  
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  
  const existing = db.prepare('SELECT * FROM billing WHERE store_id = ?').get(storeId);
  if (existing) {
    db.prepare('UPDATE billing SET plan = ?, updated_at = CURRENT_TIMESTAMP WHERE store_id = ?').run(plan, storeId);
  } else {
    db.prepare('INSERT INTO billing (store_id, plan) VALUES (?, ?)').run(storeId, plan);
  }
  
  res.json({ success: true, plan: PLANS[plan] });
});

// Get all plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

export default router;