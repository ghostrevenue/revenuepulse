import express from 'express';
import { analyticsService } from '../services/analytics.service.js';

const router = express.Router();

router.get('/dashboard', (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Shop required' });
  
  const dashboard = analyticsService.getDashboard(shop);
  res.json(dashboard);
});

router.get('/campaign/:id', (req, res) => {
  try {
    const analytics = analyticsService.getCampaignAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/campaign/:id/predict', (req, res) => {
  try {
    const prediction = analyticsService.predictLaunchTraffic(req.params.id);
    res.json(prediction);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
