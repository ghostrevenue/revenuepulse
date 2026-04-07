import express from 'express';
import * as customerService from '../services/customer.service.js';
import * as behaviorModel from '../behavior.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { sort, limit, offset, search } = req.query;
    const customers = customerService.getCustomerProfiles(req.db, req.store.id, {
      sort: sort || 'created_at DESC',
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      search: search || ''
    });
    
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = customerService.getCustomerStats(req.db, req.store.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const customer = customerService.getCustomerProfile(req.db, req.store.id, req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get behavior summary
    const behavior = behaviorModel.getCustomerBehaviorSummary(req.db, req.store.id, customer.id);
    
    res.json({ ...customer, behavior });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync', (req, res) => {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers)) {
      return res.status(400).json({ error: 'customers array required' });
    }
    
    const results = customers.map(c => customerService.syncCustomer(req.db, req.store.id, c));
    res.json({ synced: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
