import express from 'express';
import { RevenueModel } from '../models/revenue.js';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// Middleware: verify shop domain from headers (async)
async function verifyShop(req, res, next) {
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const storeId = req.headers['x-store-id'];

  await db.ensureReady();

  if (shopDomain) {
    const store = await StoreModel.findByShop(shopDomain);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    req.store = store;
  } else if (storeId) {
    const store = await StoreModel.findById(storeId);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    req.store = store;
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Get revenue summary
router.get('/summary', verifyShop, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const summary = await RevenueModel.getSummary(req.store.id, days);

  res.json({
    summary,
    period_days: days,
    store_id: req.store.id,
    shop: req.store.shop
  });
});

// Get daily revenue data
router.get('/daily', verifyShop, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const daily = await RevenueModel.getDaily(req.store.id, days);

  res.json({
    daily,
    period_days: days,
    store_id: req.store.id
  });
});

// Get latest revenue (most recent day)
router.get('/latest', verifyShop, async (req, res) => {
  const daily = await RevenueModel.getDaily(req.store.id, 1);
  res.json({
    latest: daily[0] || null,
    store_id: req.store.id
  });
});

// Upsert revenue for a specific date (called by webhook or sync)
router.post('/sync', verifyShop, async (req, res) => {
  const { date, revenue, orders, average_order_value } = req.body;

  if (!date) return res.status(400).json({ error: 'date required' });

  const aov = average_order_value || (orders > 0 ? revenue / orders : 0);
  await RevenueModel.upsert(req.store.id, date, revenue || 0, orders || 0, aov);

  res.json({ success: true, date, store_id: req.store.id });
});

export default router;
