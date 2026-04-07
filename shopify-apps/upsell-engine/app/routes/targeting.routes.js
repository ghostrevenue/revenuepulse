/**
 * RevenuePulse - Targeting Routes
 * API routes for fetching products, collections, and tags for offer builder targeting
 */

import express from 'express';
import { 
  searchProductsForTargeting, 
  getCollectionsForTargeting, 
  getCustomerTagsForTargeting 
} from '../services/product.service.js';

const router = express.Router();

/**
 * GET /api/targeting/products
 * List products for targeting (with search query param, pagination)
 */
router.get('/products', async (req, res) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const storeDomain = req.session.storeDomain;

    if (!storeDomain) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let products;

    if (q && q.trim().length >= 2) {
      // Search products
      products = await searchProductsForTargeting(q.trim(), storeDomain, parseInt(limit));
    } else {
      // Return empty for non-search requests (use dedicated search endpoint)
      return res.json({
        success: true,
        products: [],
        count: 0,
        message: 'Use search query (q) parameter to search products'
      });
    }

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('[Targeting] Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products for targeting' });
  }
});

/**
 * GET /api/targeting/collections
 * List collections for targeting
 */
router.get('/collections', async (req, res) => {
  try {
    const storeDomain = req.session.storeDomain;

    if (!storeDomain) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collections = await getCollectionsForTargeting(storeDomain);

    res.json({
      success: true,
      collections,
      count: collections.length
    });
  } catch (error) {
    console.error('[Targeting] Collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections for targeting' });
  }
});

/**
 * GET /api/targeting/tags
 * List customer tags for targeting
 */
router.get('/tags', async (req, res) => {
  try {
    const storeDomain = req.session.storeDomain;

    if (!storeDomain) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tags = await getCustomerTagsForTargeting(storeDomain);

    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('[Targeting] Tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags for targeting' });
  }
});

export default router;