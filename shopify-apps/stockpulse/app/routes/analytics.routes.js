import express from 'express';
import { ProductStockModel } from '../models/product.js';
import db from '../models/db.js';

const router = express.Router();

// Get sales velocity (units sold per week)
router.get('/velocity', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  // Mock velocity data - in production would calculate from Shopify orders
  const products = ProductStockModel.findAll(storeId);
  const velocity = products.map(p => ({
    productId: p.product_id,
    variantId: p.variant_id,
    weeklyVelocity: Math.floor(Math.random() * 50) + 5,
    daysUntilStockout: p.quantity > 0 ? Math.floor(p.quantity / (Math.random() * 10 + 2)) : 0
  }));
  
  res.json({ velocity });
});

// Get stock history
router.get('/history', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { productId, days } = req.query;
  
  let query = 'SELECT * FROM stock_history WHERE store_id = ?';
  const params = [storeId];
  
  if (productId) {
    query += ' AND product_id = ?';
    params.push(productId);
  }
  
  if (days) {
    query += ' AND created_at >= datetime("now", "-" || ? || " days")';
    params.push(parseInt(days));
  }
  
  query += ' ORDER BY created_at DESC LIMIT 100';
  
  const history = db.prepare(query).all(...params);
  res.json({ history });
});

// Get stock predictions
router.get('/predictions', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const products = ProductStockModel.findAll(storeId);
  const predictions = products.map(p => {
    const weeklySales = Math.floor(Math.random() * 40) + 5;
    const daysUntilOut = p.quantity > 0 ? Math.floor(p.quantity / (weeklySales / 7)) : 0;
    return {
      productId: p.product_id,
      currentStock: p.quantity,
      weeklySales,
      daysUntilOutOfStock: daysUntilOut,
      suggestedReorderDate: daysUntilOut > 0 ? new Date(Date.now() + (daysUntilOut - 7) * 86400000).toISOString() : 'now'
    };
  });
  
  res.json({ predictions });
});

// Get stock summary
router.get('/summary', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const products = ProductStockModel.findAll(storeId);
  const lowStock = products.filter(p => p.quantity <= p.reorder_point && p.quantity > 0);
  const outOfStock = products.filter(p => p.quantity === 0);
  
  res.json({
    totalProducts: products.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    totalUnits: products.reduce((sum, p) => sum + p.quantity, 0)
  });
});

export default router;