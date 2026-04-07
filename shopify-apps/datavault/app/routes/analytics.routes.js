import express from 'express';
import * as rfmService from '../services/rfm.service.js';
import * as churnService from '../services/churn.service.js';
import * as customerModel from '../customer.js';

const router = express.Router();

// RFM Analysis
router.get('/rfm', (req, res) => {
  try {
    const rfmMatrix = rfmService.getRfmMatrix(req.db, req.store.id);
    res.json(rfmMatrix);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rfm/scores', (req, res) => {
  try {
    const scores = rfmService.calculateRfmScores(req.db, req.store.id);
    res.json({ scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Churn Analysis
router.get('/churn', (req, res) => {
  try {
    const distribution = churnService.getChurnDistribution(req.db, req.store.id);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/churn/summary', (req, res) => {
  try {
    const summary = churnService.getChurnSummary(req.db, req.store.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/churn/at-risk', (req, res) => {
  try {
    const customers = churnService.getAtRiskCustomers(req.db, req.store.id);
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LTV Distribution
router.get('/ltv/distribution', (req, res) => {
  try {
    const customers = customerModel.getCustomers(req.db, req.store.id, { limit: 10000 });
    
    const buckets = [
      { label: '$0-$50', min: 0, max: 50, count: 0 },
      { label: '$50-$100', min: 50, max: 100, count: 0 },
      { label: '$100-$200', min: 100, max: 200, count: 0 },
      { label: '$200-$500', min: 200, max: 500, count: 0 },
      { label: '$500-$1000', min: 500, max: 1000, count: 0 },
      { label: '$1000+', min: 1000, max: Infinity, count: 0 }
    ];
    
    customers.forEach(c => {
      const bucket = buckets.find(b => c.total_spent >= b.min && c.total_spent < b.max);
      if (bucket) bucket.count++;
    });
    
    res.json({ distribution: buckets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Overall Analytics Dashboard
router.get('/overview', (req, res) => {
  try {
    const stats = customerModel.getCustomerStats(req.db, req.store.id);
    const churnSummary = churnService.getChurnSummary(req.db, req.store.id);
    const rfmMatrix = rfmService.getRfmMatrix(req.db, req.store.id);
    
    res.json({
      customers: stats,
      churn: churnSummary,
      rfm: {
        champions: rfmMatrix.segments.champions,
        loyal: rfmMatrix.segments.loyal,
        potential: rfmMatrix.segments.potential,
        atRisk: rfmMatrix.segments.atRisk,
        lost: rfmMatrix.segments.lost
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
