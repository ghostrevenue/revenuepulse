import express from 'express';
import Plan from '../models/plan.js';
import { BillingService } from '../services/billing.service.js';

const router = express.Router();

// Get all plans for a store
router.get('/store/:storeId', (req, res) => {
  try {
    const plans = Plan.findByStore(parseInt(req.params.storeId));
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get single plan
router.get('/:id', (req, res) => {
  try {
    const plan = Plan.findById(parseInt(req.params.id));
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// Create plan
router.post('/', (req, res) => {
  try {
    const data = req.body;
    
    // Validate frequency
    const validFrequencies = [7, 14, 30, 60, 90];
    if (!validFrequencies.includes(parseInt(data.frequency_days))) {
      return res.status(400).json({ 
        error: 'Invalid frequency', 
        validOptions: validFrequencies 
      });
    }
    
    // Validate discount
    const discount = parseFloat(data.discount_percent);
    if (discount < 5 || discount > 30) {
      return res.status(400).json({ 
        error: 'Discount must be between 5 and 30 percent' 
      });
    }
    
    // Check plan limit
    const limitCheck = BillingService.checkLimit(data.store_id, 'plans');
    if (!limitCheck.canAdd) {
      return res.status(400).json({ 
        error: 'Plan limit reached', 
        limit: limitCheck.limit 
      });
    }
    
    const plan = Plan.create(data);
    res.status(201).json({ plan });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Update plan
router.put('/:id', (req, res) => {
  try {
    const data = req.body;
    
    // Validate discount
    if (data.discount_percent !== undefined) {
      const discount = parseFloat(data.discount_percent);
      if (discount < 5 || discount > 30) {
        return res.status(400).json({ 
          error: 'Discount must be between 5 and 30 percent' 
        });
      }
    }
    
    Plan.update(parseInt(req.params.id), data);
    const plan = Plan.findById(parseInt(req.params.id));
    res.json({ plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Deactivate plan
router.delete('/:id', (req, res) => {
  try {
    Plan.deactivate(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deactivating plan:', error);
    res.status(500).json({ error: 'Failed to deactivate plan' });
  }
});

export default router;
