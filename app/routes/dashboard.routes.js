import express from 'express';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// Middleware: verify shop domain from headers
async function verifyShop(req, res, next) {
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const storeId = req.headers['x-store-id'];
  await db.ensureReady();
  let store;
  if (shopDomain) {
    store = await StoreModel.findByShop(shopDomain);
  } else if (storeId) {
    store = await StoreModel.findById(storeId);
  }
  if (!store) return res.status(401).json({ error: 'Store not found' });
  req.store = store;
  next();
}

// GET /api/dashboard/stats
// Returns total accepts, declines, revenue lifted, acceptance rate
router.get('/stats', verifyShop, async (req, res) => {
  try {
    // Get totals per response type
    const totals = db.usePostgres
      ? await db.prepare(`
          SELECT response, COUNT(*) as count
          FROM upsell_responses
          WHERE store_id = $1 AND response IN ('accepted', 'declined')
          GROUP BY response
        `).all(req.store.id)
      : db.prepare(`
          SELECT response, COUNT(*) as count
          FROM upsell_responses
          WHERE store_id = ? AND response IN ('accepted', 'declined')
          GROUP BY response
        `).all(req.store.id);

    const totalMap = {};
    for (const t of (totals || [])) {
      totalMap[t.response] = parseInt(t.count);
    }

    const accepts = totalMap['accepted'] || 0;
    const declines = totalMap['declined'] || 0;
    const total = accepts + declines;
    const acceptanceRate = total > 0 ? Math.round((accepts / total) * 10000) / 100 : 0;

    // Estimate revenue lifted — sum of responses where response = 'accepted'
    // We approximate using accepted count (actual revenue tracking requires Shopify order edits API)
    let revenueLifted = 0;
    if (db.usePostgres) {
      const rows = await db.prepare(`
        SELECT COUNT(*) as accepted_count
        FROM upsell_responses
        WHERE store_id = $1 AND response = 'accepted'
      `).all(req.store.id);
      revenueLifted = (rows[0]?.accepted_count || 0) * 0; // placeholder — real impl would fetch order $ from Shopify
    } else {
      const row = db.prepare(`
        SELECT COUNT(*) as accepted_count
        FROM upsell_responses
        WHERE store_id = ? AND response = 'accepted'
      `).get(req.store.id);
      revenueLifted = (row?.accepted_count || 0) * 0;
    }

    res.json({
      accepts,
      declines,
      total_responses: total,
      acceptance_rate: acceptanceRate,
      revenue_lifted: revenueLifted,
      store_id: req.store.id
    });
  } catch (e) {
    console.error('[/dashboard/stats]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dashboard/recent
// Returns recent offer responses
router.get('/recent', verifyShop, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  try {
    const responses = db.usePostgres
      ? await db.prepare(`
          SELECT r.id, r.order_id, r.offer_id, r.response, r.created_at,
                 o.offer_type, o.headline, o.message
          FROM upsell_responses r
          LEFT JOIN upsell_offers o ON r.offer_id = o.id
          WHERE r.store_id = $1
          ORDER BY r.created_at DESC
          LIMIT $2
        `).all(req.store.id, limit)
      : db.prepare(`
          SELECT r.id, r.order_id, r.offer_id, r.response, r.created_at,
                 o.offer_type, o.headline, o.message
          FROM upsell_responses r
          LEFT JOIN upsell_offers o ON r.offer_id = o.id
          WHERE r.store_id = ?
          ORDER BY r.created_at DESC
          LIMIT ?
        `).all(req.store.id, limit);

    res.json({ responses: responses || [] });
  } catch (e) {
    console.error('[/dashboard/recent]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
