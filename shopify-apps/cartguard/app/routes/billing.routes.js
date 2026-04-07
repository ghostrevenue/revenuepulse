import { Router } from 'express';
import { getStore, updateStore } from '../models/store.js';
import { getDB } from '../models/db.js';

const router = Router();

const PLANS = {
  starter: { name: 'Starter', price: 19, emails: 500, campaigns: 1, features: ['Basic Analytics', 'Email Support'] },
  growth: { name: 'Growth', price: 49, emails: -1, campaigns: 5, features: ['A/B Testing', 'Priority Support'] },
  pro: { name: 'Pro', price: 99, emails: -1, campaigns: -1, features: ['SMS Recovery', 'Priority Support', 'Custom Integrations'] }
};

// Get available plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Get current billing status
router.get('/status', (req, res) => {
  const { store_id } = req.query;
  
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const store = getStore(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const plan = PLANS[store.billing_plan] || PLANS.starter;
    
    res.json({
      plan: store.billing_plan,
      status: store.billing_status || 'active',
      plan_details: plan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate/change plan
router.post('/activate', (req, res) => {
  const { store_id, plan } = req.body;
  
  if (!store_id || !plan) {
    return res.status(400).json({ error: 'Missing store_id or plan' });
  }
  
  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  
  try {
    // In production, this would redirect to Shopify Billing API
    const store = updateStore(store_id, { 
      billing_plan: plan,
      billing_status: 'active'
    });
    
    // Update or create billing record
    const db = getDB();
    const existing = db.prepare('SELECT * FROM billing WHERE store_id = ?').get(store_id);
    
    if (existing) {
      db.prepare(`
        UPDATE billing SET plan = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE store_id = ?
      `).run(plan, 'active', store_id);
    } else {
      const { v4: uuidv4 } = require('uuid');
      db.prepare(`
        INSERT INTO billing (id, store_id, plan, status)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), store_id, plan, 'active');
    }
    
    res.json({ 
      ok: true, 
      plan,
      message: `Activated ${PLANS[plan].name} plan`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel subscription
router.post('/cancel', (req, res) => {
  const { store_id } = req.body;
  
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    updateStore(store_id, { billing_status: 'cancelled' });
    res.json({ ok: true, message: 'Subscription cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
