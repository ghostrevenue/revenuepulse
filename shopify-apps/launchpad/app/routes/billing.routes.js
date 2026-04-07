import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    features: ['1 campaign', '500 subscribers', 'Basic analytics']
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    features: ['5 campaigns', 'Unlimited subscribers', 'Referral system', 'Early access']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    features: ['Unlimited campaigns', 'Viral sharing', 'Full analytics', 'Priority support']
  }
];

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

router.post('/subscribe', async (req, res) => {
  const { shop, planId } = req.body;
  
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });
  
  const chargeId = `charge_${crypto.randomBytes(8).toString('hex')}`;
  
  res.json({
    success: true,
    message: `Subscription to ${plan.name} ($${plan.price}/mo) confirmed`,
    chargeId,
    plan
  });
});

router.get('/status', (req, res) => {
  const { shop } = req.query;
  res.json({
    active: true,
    plan: 'growth',
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
});

router.post('/cancel', (req, res) => {
  const { shop } = req.body;
  res.json({ success: true, message: 'Subscription cancelled' });
});

export default router;
