/**
 * ProofFlow - Products Routes
 * Product review settings and stats
 */

import express from 'express';
import fetch from 'node-fetch';
import { getStore } from '../models/store.js';
import { getDb } from '../models/db.js';
import { getReviewsStats } from '../models/review.js';

const router = express.Router();
const SHOPIFY_API_VERSION = '2024-01';

function requireAuth(req, res, next) {
  if (!req.session || !req.session.storeDomain) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

async function getShopifyProducts(accessToken, shopDomain, limit = 50) {
  const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=${limit}`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.products;
}

router.get('/', async (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const products = await getShopifyProducts(store.access_token, req.session.storeDomain);
    const db = getDb();

    const productIds = products.map(p => p.id.toString());
    let productStats = {};

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const statsStmt = db.prepare(`
        SELECT 
          product_id,
          COUNT(*) as review_count,
          AVG(rating) as avg_rating
        FROM reviews 
        WHERE store_id = ? AND is_public = 1 AND product_id IN (${placeholders})
        GROUP BY product_id
      `);
      const stats = statsStmt.all(store.id, ...productIds);
      stats.forEach(s => {
        productStats[s.product_id] = {
          reviewCount: s.review_count,
          avgRating: s.avg_rating ? parseFloat(s.avg_rating.toFixed(1)) : 0
        };
      });

      const settingsStmt = db.prepare(`
        SELECT product_id, reviews_enabled, widgets_enabled 
        FROM product_settings 
        WHERE store_id = ? AND product_id IN (${placeholders})
      `);
      const settings = settingsStmt.all(store.id, ...productIds);
      settings.forEach(s => {
        if (!productStats[s.product_id]) {
          productStats[s.product_id] = { reviewCount: 0, avgRating: 0 };
        }
        productStats[s.product_id].reviewsEnabled = !!s.reviews_enabled;
        productStats[s.product_id].widgetsEnabled = !!s.widgets_enabled;
      });
    }

    const productsWithStats = products.map(product => ({
      id: product.id.toString(),
      title: product.title,
      vendor: product.vendor,
      product_type: product.product_type,
      handle: product.handle,
      image: product.image ? product.image.src : null,
      stats: productStats[product.id.toString()] || { reviewCount: 0, avgRating: 0, reviewsEnabled: true, widgetsEnabled: true }
    }));

    res.json({ success: true, products: productsWithStats });
  } catch (error) {
    console.error('[Products] List error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id/reviews', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const db = getDb();
    const productId = req.params.id;

    const reviewsStmt = db.prepare(`
      SELECT * FROM reviews 
      WHERE store_id = ? AND product_id = ? AND is_public = 1
      ORDER BY created_at DESC
      LIMIT 50
    `);
    const reviews = reviewsStmt.all(store.id, productId);

    const statsStmt = db.prepare(`
      SELECT 
        COUNT(*) as count,
        AVG(rating) as avg,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating
      FROM reviews 
      WHERE store_id = ? AND product_id = ? AND is_public = 1
    `);
    const stats = statsStmt.get(store.id, productId);

    res.json({
      success: true,
      reviews: reviews.map(r => ({ ...r, photos: JSON.parse(r.photos || '[]') })),
      stats: {
        count: stats.count || 0,
        averageRating: stats.avg ? parseFloat(stats.avg.toFixed(1)) : 0,
        minRating: stats.min_rating || 0,
        maxRating: stats.max_rating || 0
      }
    });
  } catch (error) {
    console.error('[Products] Reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch product reviews' });
  }
});

router.put('/:id/reviews-settings', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const db = getDb();
    const productId = req.params.id;
    const {
      reviews_enabled,
      widgets_enabled,
      star_rating_enabled,
      review_count_enabled,
      live_counter_enabled,
      purchase_popup_enabled,
      auto_review_requests
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO product_settings 
        (store_id, product_id, reviews_enabled, widgets_enabled, star_rating_enabled, 
         review_count_enabled, live_counter_enabled, purchase_popup_enabled, auto_review_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(store_id, product_id) DO UPDATE SET
        reviews_enabled = excluded.reviews_enabled,
        widgets_enabled = excluded.widgets_enabled,
        star_rating_enabled = excluded.star_rating_enabled,
        review_count_enabled = excluded.review_count_enabled,
        live_counter_enabled = excluded.live_counter_enabled,
        purchase_popup_enabled = excluded.purchase_popup_enabled,
        auto_review_requests = excluded.auto_review_requests,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      store.id,
      productId,
      reviews_enabled !== false ? 1 : 0,
      widgets_enabled !== false ? 1 : 0,
      star_rating_enabled !== false ? 1 : 0,
      review_count_enabled !== false ? 1 : 0,
      live_counter_enabled !== false ? 1 : 0,
      purchase_popup_enabled !== false ? 1 : 0,
      auto_review_requests !== false ? 1 : 0
    );

    const getStmt = db.prepare('SELECT * FROM product_settings WHERE store_id = ? AND product_id = ?');
    const settings = getStmt.get(store.id, productId);

    res.json({ success: true, settings });
  } catch (error) {
    console.error('[Products] Settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
