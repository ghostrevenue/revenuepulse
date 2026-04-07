import express from 'express';
import { ProductStockModel } from '../models/product.js';
import db from '../models/db.js';

const router = express.Router();

// Get all products with stock
router.get('/', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const products = ProductStockModel.findAll(storeId);
  res.json({ products });
});

// Get single product
router.get('/:id', (req, res) => {
  const product = ProductStockModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

// Get low stock products
router.get('/status/low-stock', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const products = ProductStockModel.getLowStock(storeId);
  res.json({ products, count: products.length });
});

// Get out of stock products
router.get('/status/out-of-stock', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const products = ProductStockModel.getOutOfStock(storeId);
  res.json({ products, count: products.length });
});

// Bulk update stock
router.post('/bulk-update', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array required' });
  }
  
  const itemsWithStore = items.map(item => ({ ...item, storeId }));
  ProductStockModel.bulkUpsert(itemsWithStore);
  
  res.json({ success: true, updated: items.length });
});

// Update single product stock
router.put('/:id', (req, res) => {
  const { quantity, reorderPoint, reorderQuantity } = req.body;
  const product = ProductStockModel.findById(req.params.id);
  
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  if (quantity !== undefined) {
    ProductStockModel.updateQuantity(req.params.id, quantity);
  }
  
  if (reorderPoint !== undefined || reorderQuantity !== undefined) {
    const stmt = db.prepare('UPDATE product_stocks SET reorder_point = COALESCE(?, reorder_point), reorder_quantity = COALESCE(?, reorder_quantity), updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(reorderPoint, reorderQuantity, req.params.id);
  }
  
  res.json({ success: true });
});

export default router;