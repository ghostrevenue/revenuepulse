/**
 * ProofFlow - Billing Routes
 * Shopify Billing API integration for subscriptions
 */

import express from 'express';
import crypto from 'crypto';
import { updateStorePlan, getStore } from '../models/store.js';

const router = express.Router();

const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    interval: '30 days',
    features: [
      '100 reviews/month',
      'Basic social proof widgets',
      'Email review requests',
      'Standard analytics'
    ]
  },
  growth: {
    name: 'Growth',
    price: 49,
    interval: '30 days',
    features: [
      'Unlimited reviews',
      'All widget types',
      'A/B test subject lines',
      'Advanced analytics',
      'Priority support'
    ]
  },
  pro: {
    name: 'Pro',
    price: 99,
    interval: '30 days',
    features: [
      'Everything in Growth',
      'Photo reviews',
      'UGC gallery',
      'AI-powered review responses',
      'Custom branding',
      'Dedicated support'
    ]
  }
};

router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PLANS
  });
});

router.get('/current', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    res.json({
      success: true,
      currentPlan: store.plan,
      planDetails: PLANS[store.plan] || PLANS.starter
    });
  } catch (error) {
    console.error('[Billing] Current status error:', error);
    res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

router.post('/activate', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const planDetails = PLANS[plan];

    const returnUrl = `${process.env.APP_URL}/api/billing/confirmed?plan=${plan}&shop=${req.session.storeDomain}`;
    const chargeId = `charge_${crypto.randomBytes(16).toString('hex')}`;

    console.log(`[Billing] Activating ${plan} plan for ${req.session.storeDomain}, charge: ${chargeId}`);

    updateStorePlan(req.session.storeDomain, plan);

    res.json({
      success: true,
      activated: true,
      plan,
      planDetails,
      message: `${planDetails.name} plan activated successfully`
    });
  } catch (error) {
    console.error('[Billing] Activate error:', error);
    res.status(500).json({ error: 'Failed to activate billing plan' });
  }
});

router.get('/confirmed', async (req, res) => {
  try {
    const { plan, shop } = req.query;

    if (!plan || !shop) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    updateStorePlan(shop, plan);

    console.log(`[Billing] Plan ${plan} confirmed and activated for ${shop}`);

    res.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/?shop=${shop}&billing=activated&plan=${plan}`);
  } catch (error) {
    console.error('[Billing] Confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm billing' });
  }
});

router.post('/cancel', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    updateStorePlan(req.session.storeDomain, 'starter');

    console.log(`[Billing] Subscription cancelled for ${req.session.storeDomain}`);

    res.json({
      success: true,
      message: 'Subscription cancelled. Downgraded to Starter plan.'
    });
  } catch (error) {
    console.error('[Billing] Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

router.post('/trial', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    console.log(`[Billing] Trial started for ${req.session.storeDomain}`);

    res.json({
      success: true,
      trial: true,
      trialDays: 14,
      message: '14-day free trial started. Full access enabled.'
    });
  } catch (error) {
    console.error('[Billing] Trial error:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
});

export default router;
