import express from 'express';
import { BillingService } from '../services/billing.service.js';

const router = express.Router();

// Get pricing tiers
router.get('/pricing', (req, res) => {
  try {
    const pricing = BillingService.getPricing();
    res.json({ pricing });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// Get current plan for store
router.get('/store/:storeId', (req, res) => {
  try {
    const planType = BillingService.getPlanType(parseInt(req.params.storeId));
    const features = BillingService.getFeatures(parseInt(req.params.storeId));
    const subscriberLimit = BillingService.getSubscriberLimit(parseInt(req.params.storeId));
    const planLimit = BillingService.getPlanLimit(parseInt(req.params.storeId));
    
    res.json({
      planType,
      features,
      limits: {
        subscribers: subscriberLimit,
        plans: planLimit
      }
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    res.status(500).json({ error: 'Failed to fetch billing info' });
  }
});

// Upgrade/downgrade plan
router.post('/store/:storeId/upgrade', (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['starter', 'growth', 'pro'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }
    
    const result = BillingService.upgradePlan(parseInt(req.params.storeId), planType);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

// Cancel plan
router.post('/store/:storeId/cancel', (req, res) => {
  try {
    const result = BillingService.cancelPlan(parseInt(req.params.storeId));
    res.json(result);
  } catch (error) {
    console.error('Error cancelling plan:', error);
    res.status(500).json({ error: 'Failed to cancel plan' });
  }
});

// Check limits
router.get('/store/:storeId/limits', (req, res) => {
  try {
    const { type } = req.query;
    if (!['subscribers', 'plans'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use "subscribers" or "plans"' });
    }
    
    const limits = BillingService.checkLimit(parseInt(req.params.storeId), type);
    res.json(limits);
  } catch (error) {
    console.error('Error checking limits:', error);
    res.status(500).json({ error: 'Failed to check limits' });
  }
});

// Get proration
router.get('/store/:storeId/proration', (req, res) => {
  try {
    const { newPlanType, daysRemaining } = req.query;
    const proration = BillingService.calculateProration(
      parseInt(req.params.storeId),
      newPlanType,
      parseInt(daysRemaining) || 15
    );
    res.json(proration);
  } catch (error) {
    console.error('Error calculating proration:', error);
    res.status(500).json({ error: 'Failed to calculate proration' });
  }
});

// Check feature access
router.get('/store/:storeId/features/:feature', (req, res) => {
  try {
    const hasFeature = BillingService.hasFeature(
      parseInt(req.params.storeId),
      req.params.feature
    );
    res.json({ hasFeature });
  } catch (error) {
    console.error('Error checking feature:', error);
    res.status(500).json({ error: 'Failed to check feature access' });
  }
});

export default router;
