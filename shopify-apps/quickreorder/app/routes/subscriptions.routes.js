import express from 'express';
import Subscription from '../models/subscription.js';
import { SubscriptionService } from '../services/subscription.service.js';
import { BillingService } from '../services/billing.service.js';

const router = express.Router();

// Get all subscriptions for a store
router.get('/store/:storeId', (req, res) => {
  try {
    const subscriptions = Subscription.findByStore(parseInt(req.params.storeId));
    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get active subscriptions
router.get('/store/:storeId/active', (req, res) => {
  try {
    const subscriptions = Subscription.findActiveByStore(parseInt(req.params.storeId));
    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get subscriptions by customer
router.get('/customer/:customerId/store/:storeId', (req, res) => {
  try {
    const subscriptions = Subscription.findByCustomer(
      req.params.customerId,
      parseInt(req.params.storeId)
    );
    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get single subscription
router.get('/:id', (req, res) => {
  try {
    const subscription = SubscriptionService.getSubscriptionWithDetails(parseInt(req.params.id));
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create subscription
router.post('/', (req, res) => {
  try {
    const data = req.body;
    
    // Check subscriber limit
    const limitCheck = BillingService.checkLimit(data.store_id, 'subscribers');
    if (!limitCheck.canAdd) {
      return res.status(400).json({ 
        error: 'Subscriber limit reached', 
        limit: limitCheck.limit 
      });
    }
    
    const subscription = SubscriptionService.createSubscription(data);
    res.status(201).json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/:id', (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity) {
      SubscriptionService.updateQuantity(parseInt(req.params.id), quantity);
    }
    const subscription = Subscription.findById(parseInt(req.params.id));
    res.json({ subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Pause subscription
router.post('/:id/pause', (req, res) => {
  try {
    const subscription = SubscriptionService.pauseSubscription(parseInt(req.params.id));
    res.json({ subscription });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

// Resume subscription
router.post('/:id/resume', (req, res) => {
  try {
    const subscription = SubscriptionService.resumeSubscription(parseInt(req.params.id));
    res.json({ subscription });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// Cancel subscription
router.post('/:id/cancel', (req, res) => {
  try {
    const subscription = SubscriptionService.cancelSubscription(parseInt(req.params.id));
    res.json({ subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Skip next delivery
router.post('/:id/skip', (req, res) => {
  try {
    const subscription = SubscriptionService.skipNextDelivery(parseInt(req.params.id));
    res.json({ subscription });
  } catch (error) {
    console.error('Error skipping delivery:', error);
    res.status(500).json({ error: 'Failed to skip delivery' });
  }
});

// Change plan
router.post('/:id/change-plan', (req, res) => {
  try {
    const { planId } = req.body;
    const subscription = SubscriptionService.changePlan(parseInt(req.params.id), planId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription or plan not found' });
    }
    res.json({ subscription });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

// Apply retention discount
router.post('/:id/retention-discount', (req, res) => {
  try {
    const discount = SubscriptionService.applyRetentionDiscount(parseInt(req.params.id));
    res.json({ discountApplied: discount });
  } catch (error) {
    console.error('Error applying retention discount:', error);
    res.status(500).json({ error: 'Failed to apply retention discount' });
  }
});

export default router;
