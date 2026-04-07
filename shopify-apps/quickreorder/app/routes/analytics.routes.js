import express from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { ChurnService } from '../services/churn.service.js';

const router = express.Router();

// Get dashboard metrics
router.get('/dashboard/:storeId', (req, res) => {
  try {
    const metrics = AnalyticsService.getDashboardMetrics(parseInt(req.params.storeId));
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get MRR
router.get('/mrr/:storeId', (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const mrr = AnalyticsService.getMRRTrend(parseInt(req.params.storeId), months);
    res.json({ mrr });
  } catch (error) {
    console.error('Error fetching MRR:', error);
    res.status(500).json({ error: 'Failed to fetch MRR' });
  }
});

// Get LTV
router.get('/ltv/:storeId', (req, res) => {
  try {
    const ltv = AnalyticsService.getLTV(parseInt(req.params.storeId));
    res.json({ ltv });
  } catch (error) {
    console.error('Error fetching LTV:', error);
    res.status(500).json({ error: 'Failed to fetch LTV' });
  }
});

// Get churn funnel
router.get('/churn-funnel/:storeId', (req, res) => {
  try {
    const funnel = AnalyticsService.getChurnFunnel(parseInt(req.params.storeId));
    res.json({ funnel });
  } catch (error) {
    console.error('Error fetching churn funnel:', error);
    res.status(500).json({ error: 'Failed to fetch churn funnel' });
  }
});

// Get churn rate trend
router.get('/churn-trend/:storeId', (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const trend = ChurnService.getChurnTrend(parseInt(req.params.storeId), months);
    res.json({ trend });
  } catch (error) {
    console.error('Error fetching churn trend:', error);
    res.status(500).json({ error: 'Failed to fetch churn trend' });
  }
});

// Get subscriber growth
router.get('/growth/:storeId', (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const growth = AnalyticsService.getSubscriberGrowth(parseInt(req.params.storeId), months);
    res.json({ growth });
  } catch (error) {
    console.error('Error fetching subscriber growth:', error);
    res.status(500).json({ error: 'Failed to fetch subscriber growth' });
  }
});

// Get age distribution
router.get('/age-distribution/:storeId', (req, res) => {
  try {
    const distribution = AnalyticsService.getAgeDistribution(parseInt(req.params.storeId));
    res.json({ distribution });
  } catch (error) {
    console.error('Error fetching age distribution:', error);
    res.status(500).json({ error: 'Failed to fetch age distribution' });
  }
});

// Get plan performance
router.get('/plan-performance/:storeId', (req, res) => {
  try {
    const performance = AnalyticsService.getPlanPerformance(parseInt(req.params.storeId));
    res.json({ performance });
  } catch (error) {
    console.error('Error fetching plan performance:', error);
    res.status(500).json({ error: 'Failed to fetch plan performance' });
  }
});

// Get frequency distribution
router.get('/frequency-distribution/:storeId', (req, res) => {
  try {
    const distribution = AnalyticsService.getFrequencyDistribution(parseInt(req.params.storeId));
    res.json({ distribution });
  } catch (error) {
    console.error('Error fetching frequency distribution:', error);
    res.status(500).json({ error: 'Failed to fetch frequency distribution' });
  }
});

// Get dunning metrics
router.get('/dunning/:storeId', (req, res) => {
  try {
    const metrics = AnalyticsService.getDunningMetrics(parseInt(req.params.storeId));
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching dunning metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dunning metrics' });
  }
});

// Get at-risk subscriptions
router.get('/at-risk/:storeId', (req, res) => {
  try {
    const subscriptions = ChurnService.getAtRiskSubscriptions(parseInt(req.params.storeId));
    res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching at-risk subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch at-risk subscriptions' });
  }
});

export default router;
