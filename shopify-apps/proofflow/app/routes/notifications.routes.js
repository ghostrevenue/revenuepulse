/**
 * ProofFlow - Notifications Routes
 * Social proof notification management
 */

import express from 'express';
import { getStore } from '../models/store.js';
import {
  createNotification,
  getNotifications,
  markNotificationShown,
  getNotificationStats,
  getActivePurchaseNotifications
} from '../models/notification.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session || !req.session.storeDomain) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const filters = {
      type: req.query.type,
      product_id: req.query.product_id,
      shown: req.query.shown === 'true' ? true : req.query.shown === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    const notifications = getNotifications(store.id, filters);
    const stats = getNotificationStats(store.id);

    res.json({
      success: true,
      notifications,
      stats
    });
  } catch (error) {
    console.error('[Notifications] List error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const stats = getNotificationStats(store.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[Notifications] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/active', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { product_id, session_id } = req.query;

    if (!product_id || !session_id) {
      return res.status(400).json({ error: 'product_id and session_id are required' });
    }

    const notification = getActivePurchaseNotifications(store.id, product_id, session_id);

    res.json({
      success: true,
      notification: notification || null
    });
  } catch (error) {
    console.error('[Notifications] Active error:', error);
    res.status(500).json({ error: 'Failed to fetch active notification' });
  }
});

router.post('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { type, product_id, location, city, session_id } = req.body;

    if (!type || !product_id) {
      return res.status(400).json({ error: 'Type and product_id are required' });
    }

    const notification = createNotification({
      store_id: store.id,
      type,
      product_id,
      location,
      city,
      session_id
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('[Notifications] Create error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.put('/:id/shown', (req, res) => {
  try {
    markNotificationShown(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('[Notifications] Shown error:', error);
    res.status(500).json({ error: 'Failed to mark as shown' });
  }
});

export default router;
