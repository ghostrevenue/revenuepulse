/**
 * ProofFlow - Analytics Routes
 * Review metrics and analytics
 */

import express from 'express';
import { getStore } from '../models/store.js';
import { getDb } from '../models/db.js';

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

    const db = getDb();

    const totalReviewsStmt = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE store_id = ?');
    const totalReviews = totalReviewsStmt.get(store.id).count;

    const avgRatingStmt = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE store_id = ? AND is_public = 1');
    const avgResult = avgRatingStmt.get(store.id);
    const avgRating = avgResult.avg ? parseFloat(avgResult.avg.toFixed(1)) : 0;

    const distributionStmt = db.prepare(`
      SELECT rating, COUNT(*) as count 
      FROM reviews 
      WHERE store_id = ? 
      GROUP BY rating
      ORDER BY rating DESC
    `);
    const distribution = distributionStmt.all(store.id);

    const distributionMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => {
      distributionMap[d.rating] = d.count;
    });

    const monthlyReviewsStmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM reviews 
      WHERE store_id = ?
      AND created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `);
    const monthlyData = monthlyReviewsStmt.all(store.id);

    const verifiedStmt = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE store_id = ? AND verified = 1');
    const verifiedReviews = verifiedStmt.get(store.id).count;

    const helpfulStmt = db.prepare('SELECT SUM(helpful_count) as total FROM reviews WHERE store_id = ?');
    const helpfulResult = helpfulStmt.get(store.id);
    const totalHelpful = helpfulResult.total || 0;

    const topProductsStmt = db.prepare(`
      SELECT 
        product_id,
        COUNT(*) as review_count,
        AVG(rating) as avg_rating
      FROM reviews 
      WHERE store_id = ? AND is_public = 1
      GROUP BY product_id
      ORDER BY review_count DESC
      LIMIT 10
    `);
    const topProducts = topProductsStmt.all(store.id);

    const recentReviewsStmt = db.prepare(`
      SELECT * FROM reviews 
      WHERE store_id = ? 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    const recentReviews = recentReviewsStmt.all(store.id);

    const thisMonthStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM reviews 
      WHERE store_id = ? 
      AND created_at >= datetime('now', 'start of month')
    `);
    const thisMonth = thisMonthStmt.get(store.id).count;

    const lastMonthStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM reviews 
      WHERE store_id = ? 
      AND created_at >= datetime('now', '-1 month')
      AND created_at < datetime('now', 'start of month')
    `);
    const lastMonth = lastMonthStmt.get(store.id).count;

    const monthOverMonth = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      analytics: {
        overview: {
          totalReviews,
          averageRating: avgRating,
          verifiedReviews,
          totalHelpful,
          reviewsThisMonth: thisMonth,
          monthOverMonthChange: parseFloat(monthOverMonth)
        },
        distribution: distributionMap,
        monthlyTrends: monthlyData,
        topProducts: topProducts.map(p => ({
          productId: p.product_id,
          reviewCount: p.review_count,
          avgRating: p.avg_rating ? parseFloat(p.avg_rating.toFixed(1)) : 0
        })),
        recentReviews: recentReviews.map(r => ({
          ...r,
          photos: JSON.parse(r.photos || '[]')
        }))
      }
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/events', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const db = getDb();
    const eventType = req.query.type;

    let query = 'SELECT * FROM analytics_events WHERE store_id = ?';
    const params = [store.id];

    if (eventType) {
      query += ' AND event_type = ?';
      params.push(eventType);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = db.prepare(query);
    const events = stmt.all(...params);

    res.json({ success: true, events });
  } catch (error) {
    console.error('[Analytics] Events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/track', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { event_type, product_id, value } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO analytics_events (store_id, event_type, product_id, value)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(store.id, event_type, product_id || null, value || null);

    res.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

export default router;
