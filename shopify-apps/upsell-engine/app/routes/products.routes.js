/**
 * RevenuePulse - Products Routes
 * Product search and details for offer builder
 */

import express from 'express';
import { searchProducts, getProductDetails, fetchOrderProducts } from '../services/product.service.js';

const router = express.Router();

/**
 * GET /api/products/search
 * Search products for offer builder
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const products = await searchProducts(q.trim(), req.session.storeDomain, parseInt(limit));

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('[Products] Search error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

/**
 * GET /api/products/:id
 * Get product details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const products = await getProductDetails([id], req.session.storeDomain);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: products[0]
    });
  } catch (error) {
    console.error('[Products] Get details error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

/**
 * POST /api/products/bulk
 * Get details for multiple products
 */
router.post('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Product IDs array required' });
    }

    if (ids.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 products at once' });
    }

    const products = await getProductDetails(ids, req.session.storeDomain);

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('[Products] Bulk get error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

/**
 * GET /api/products/from-order/:orderId
 * Get products from an order (for upsell matching)
 */
router.get('/from-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const products = await fetchOrderProducts(orderId, req.session.storeDomain);

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('[Products] Order products error:', error);
    res.status(500).json({ error: 'Failed to fetch order products' });
  }
});

export default router;
