import express from 'express';
import { RevenueModel } from '../models/revenue.js';
import { StoreModel } from '../models/store.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware: verify shop domain from headers
function verifyShop(req, res, next) {
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const storeId = req.headers['x-store-id'];

  if (shopDomain) {
    const store = StoreModel.findByShop(shopDomain);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    req.store = store;
  } else if (storeId) {
    const store = StoreModel.findById(storeId);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    req.store = store;
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Get revenue summary
router.get('/summary', verifyShop, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const summary = RevenueModel.getSummary(req.store.id, days);

  res.json({
    summary,
    period_days: days,
    store_id: req.store.id,
    shop: req.store.shop
  });
});

// Get daily revenue data
router.get('/daily', verifyShop, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const daily = RevenueModel.getDaily(req.store.id, days);

  res.json({
    daily,
    period_days: days,
    store_id: req.store.id
  });
});

// Get latest revenue (most recent day)
router.get('/latest', verifyShop, (req, res) => {
  const daily = RevenueModel.getDaily(req.store.id, 1);
  res.json({
    latest: daily[0] || null,
    store_id: req.store.id
  });
});

// Seed mock revenue data for a store (for demo/testing)
router.post('/seed', verifyShop, (req, res) => {
  const storeId = req.store.id;
  const today = new Date();

  // Generate 90 days of mock data
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const orders = Math.floor(Math.random() * 50) + 10;
    const aov = Math.random() * 100 + 30;
    const revenue = orders * aov;

    RevenueModel.upsert(storeId, dateStr, Math.round(revenue * 100) / 100, orders, Math.round(aov * 100) / 100);
  }

  res.json({ success: true, message: 'Seed data created for 90 days' });
});

// Upsert revenue for a specific date (called by webhook or sync)
router.post('/sync', verifyShop, (req, res) => {
  const { date, revenue, orders, average_order_value } = req.body;

  if (!date) return res.status(400).json({ error: 'date required' });

  const aov = average_order_value || (orders > 0 ? revenue / orders : 0);
  RevenueModel.upsert(req.store.id, date, revenue || 0, orders || 0, aov);

  res.json({ success: true, date, store_id: req.store.id });
});

export default router;
