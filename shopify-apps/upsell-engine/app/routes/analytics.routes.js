/**
 * RevenuePulse - Analytics Routes
 * Dashboard analytics and reporting
 */

import express from 'express';
import { getAnalytics, getSnapshot } from '../services/analytics.service.js';
import { getStore } from '../models/store.js';

const router = express.Router();

/**
 * GET /api/analytics
 * Get comprehensive analytics for the dashboard
 */
router.get('/', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const { startDate, endDate } = req.query;

    const analytics = await getAnalytics(req.session.storeDomain, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    console.error('[Analytics] Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/snapshot
 * Get lightweight analytics snapshot for real-time display
 */
router.get('/snapshot', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const snapshot = await getSnapshot(req.session.storeDomain);

    res.json({
      success: true,
      ...snapshot
    });
  } catch (error) {
    console.error('[Analytics] Snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

/**
 * GET /api/analytics/top-offers
 * Get top performing offers
 */
router.get('/top-offers', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const { startDate, endDate, limit = 10 } = req.query;

    const analytics = await getAnalytics(req.session.storeDomain, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      topOffers: analytics.topOffers?.slice(0, parseInt(limit)) || []
    });
  } catch (error) {
    console.error('[Analytics] Top offers error:', error);
    res.status(500).json({ error: 'Failed to fetch top offers' });
  }
});

/**
 * GET /api/analytics/funnel
 * Get conversion funnel data
 */
router.get('/funnel', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const { startDate, endDate } = req.query;

    const analytics = await getAnalytics(req.session.storeDomain, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      funnel: analytics.funnel || []
    });
  } catch (error) {
    console.error('[Analytics] Funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics
 */
router.get('/revenue', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const { startDate, endDate } = req.query;

    const analytics = await getAnalytics(req.session.storeDomain, {
      startDate,
      endDate
    });

    res.json({
      success: true,
      revenue: analytics.revenue || [],
      totalRevenue: analytics.metrics?.totalRevenue || 0
    });
  } catch (error) {
    console.error('[Analytics] Revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

export default router;
