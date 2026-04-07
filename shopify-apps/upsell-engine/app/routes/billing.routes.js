/**
 * RevenuePulse - Billing Routes
 * Shopify Billing API integration for subscriptions
 */

import express from 'express';
import crypto from 'crypto';
import { updateStorePlan, getStore } from '../models/store.js';

const router = express.Router();

// Plan definitions
const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    interval: '30 days',
    features: ['1 active offer', '100 orders/month', 'Basic analytics']
  },
  growth: {
    name: 'Growth',
    price: 49,
    interval: '30 days',
    features: ['Unlimited offers', '1,000 orders/month', 'A/B testing', 'Full analytics']
  },
  pro: {
    name: 'Pro',
    price: 99,
    interval: '30 days',
    features: ['Unlimited everything', 'AI product matching', 'Priority support']
  }
};

/**
 * GET /api/billing/plans
 * Get available billing plans
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PLANS
  });
});

/**
 * GET /api/billing/current
 * Get current billing status
 */
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

/**
 * POST /api/billing/activate
 * Activate a billing plan for the store
 */
router.post('/activate', async (req, res) => {
  try {
    const { plan, confirmationCallback } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const planDetails = PLANS[plan];

    // In a real implementation, this would use Shopify's billing API
    // The flow would be:
    // 1. Create a recurring charge via Shopify Billing API
    // 2. Redirect to confirmation URL
    // 3. Handle subscription/activation on return

    // For now, we'll simulate the activation
    const returnUrl = `${process.env.APP_URL}/api/billing/confirmed?plan=${plan}&shop=${req.session.storeDomain}`;

    // Generate a mock charge ID (in production, this comes from Shopify)
    const chargeId = `charge_${crypto.randomBytes(16).toString('hex')}`;

    console.log(`[Billing] Activating ${plan} plan for ${req.session.storeDomain}, charge: ${chargeId}`);

    // In production, you would create a real Shopify billing charge:
    /*
    const billingUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges.json`;
    const response = await fetch(billingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': store.access_token
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: planDetails.name,
          price: planDetails.price,
          interval: 'every 30 days',
          return_url: returnUrl,
          test: process.env.NODE_ENV !== 'production'
        }
      })
    });
    const data = await response.json();
    const charge = data.recurring_application_charge;
    res.redirect(charge.confirmation_url);
    */

    // For development, directly activate
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

/**
 * GET /api/billing/confirmed
 * Handle billing confirmation return from Shopify
 */
router.get('/confirmed', async (req, res) => {
  try {
    const { plan, shop, charge_id } = req.query;

    if (!plan || !shop) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // In production, verify the charge was accepted by Shopify
    /*
    const store = getStore(shop);
    const response = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges/${charge_id}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': store.access_token
        }
      }
    );
    const data = await response.json();
    if (data.recurring_application_charge.status !== 'accepted') {
      throw new Error('Charge not accepted');
    }
    */

    // Activate the plan
    updateStorePlan(shop, plan);

    console.log(`[Billing] Plan ${plan} confirmed and activated for ${shop}`);

    // Redirect to app with success message
    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?shop=${shop}&billing=activated&plan=${plan}`);
  } catch (error) {
    console.error('[Billing] Confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm billing' });
  }
});

/**
 * POST /api/billing/cancel
 * Cancel subscription
 */
router.post('/cancel', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    // In production, cancel via Shopify billing API
    // Then downgrade to free tier
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

/**
 * POST /api/billing/trial
 * Start free trial
 */
router.post('/trial', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    // Mark store as on trial (extend features based on trial plan)
    // Trial is 14 days by default
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
