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
// Returns total accepts, declines, revenue lifted, acceptance rate, and time-bounded metrics
router.get('/stats', verifyShop, async (req, res) => {
  try {
    const storeId = req.store.id;

    // Get totals per response type
    const totals = db.usePostgres
      ? (await db.query(`
          SELECT response, COUNT(*) as count
          FROM upsell_responses
          WHERE store_id = $1 AND response IN ('accepted', 'declined')
          GROUP BY response
        `, [storeId])).rows
      : db.prepare(`
          SELECT response, COUNT(*) as count
          FROM upsell_responses
          WHERE store_id = ? AND response IN ('accepted', 'declined')
          GROUP BY response
        `).all(storeId);

    const totalMap = {};
    for (const t of (totals || [])) {
      totalMap[t.response] = parseInt(t.count);
    }

    const accepts = totalMap['accepted'] || 0;
    const declines = totalMap['declined'] || 0;
    const total = accepts + declines;
    const acceptanceRate = total > 0 ? Math.round((accepts / total) * 10000) / 100 : 0;

    // Total triggered (accepted + declined)
    const totalTriggered = accepts + declines;

    // Total revenue lifted (sum of added_revenue from all accepted offers)
    let totalRevenueLifted = 0;
    if (db.usePostgres) {
      const rows = (await db.query(`
        SELECT COALESCE(SUM(added_revenue), 0) as total
        FROM upsell_responses
        WHERE store_id = $1 AND response = 'accepted'
      `, [storeId])).rows;
      totalRevenueLifted = parseFloat(rows[0]?.total || 0);
    } else {
      const row = db.prepare(`
        SELECT COALESCE(SUM(added_revenue), 0) as total
        FROM upsell_responses
        WHERE store_id = ? AND response = 'accepted'
      `).get(storeId);
      totalRevenueLifted = parseFloat(row?.total || 0);
    }

    // Calculate week-over-week trends
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7).toISOString();

    let revenueLiftedTrend = 0, acceptsTrend = 0, declinesTrend = 0, rateTrend = 0, triggeredTrend = 0;
    try {
      const thisWeekRevenue = db.usePostgres
        ? (await db.query(`SELECT COALESCE(SUM(added_revenue), 0) as total FROM upsell_responses WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2`, [storeId, weekStart])).rows[0]?.total || 0
        : db.prepare(`SELECT COALESCE(SUM(added_revenue), 0) as total FROM upsell_responses WHERE store_id = ? AND response = 'accepted' AND created_at >= ?`).get(storeId, weekStart)?.total || 0;
      const lastWeekRevenue = db.usePostgres
        ? (await db.query(`SELECT COALESCE(SUM(added_revenue), 0) as total FROM upsell_responses WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2`, [storeId, lastWeekStart])).rows[0]?.total || 0
        : db.prepare(`SELECT COALESCE(SUM(added_revenue), 0) as total FROM upsell_responses WHERE store_id = ? AND response = 'accepted' AND created_at >= ?`).get(storeId, lastWeekStart)?.total || 0;
      revenueLiftedTrend = lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;

      const thisWeekAccepts = db.usePostgres
        ? (await db.query(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2`, [storeId, weekStart])).rows[0]?.cnt || 0
        : db.prepare(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = ? AND response = 'accepted' AND created_at >= ?`).get(storeId, weekStart)?.cnt || 0;
      const lastWeekAccepts = db.usePostgres
        ? (await db.query(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2`, [storeId, lastWeekStart])).rows[0]?.cnt || 0
        : db.prepare(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = ? AND response = 'accepted' AND created_at >= ?`).get(storeId, lastWeekStart)?.cnt || 0;
      acceptsTrend = lastWeekAccepts > 0 ? Math.round(((parseInt(thisWeekAccepts) - parseInt(lastWeekAccepts)) / parseInt(lastWeekAccepts)) * 100) : 0;

      const thisWeekDeclines = db.usePostgres
        ? (await db.query(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = $1 AND response = 'declined' AND created_at >= $2`, [storeId, weekStart])).rows[0]?.cnt || 0
        : db.prepare(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = ? AND response = 'declined' AND created_at >= ?`).get(storeId, weekStart)?.cnt || 0;
      const lastWeekDeclines = db.usePostgres
        ? (await db.query(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = $1 AND response = 'declined' AND created_at >= $2`, [storeId, lastWeekStart])).rows[0]?.cnt || 0
        : db.prepare(`SELECT COUNT(*) as cnt FROM upsell_responses WHERE store_id = ? AND response = 'declined' AND created_at >= ?`).get(storeId, lastWeekStart)?.cnt || 0;
      declinesTrend = lastWeekDeclines > 0 ? Math.round(((parseInt(thisWeekDeclines) - parseInt(lastWeekDeclines)) / parseInt(lastWeekDeclines)) * 100) : 0;

      const thisWeekTotal = parseInt(thisWeekAccepts) + parseInt(thisWeekDeclines);
      const lastWeekTotal = parseInt(lastWeekAccepts) + parseInt(lastWeekDeclines);
      const thisWeekRate = thisWeekTotal > 0 ? (parseInt(thisWeekAccepts) / thisWeekTotal) * 100 : 0;
      const lastWeekRate = lastWeekTotal > 0 ? (parseInt(lastWeekAccepts) / lastWeekTotal) * 100 : 0;
      rateTrend = lastWeekRate > 0 ? Math.round(((thisWeekRate - lastWeekRate) / lastWeekRate) * 100) : 0;
      triggeredTrend = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;
    } catch (e) { /* trends are optional */ }

    // Revenue per accept (average added_revenue per accepted offer)
    const revenuePerAccept = accepts > 0 ? Math.round((totalRevenueLifted / accepts) * 100) / 100 : 0;

    // ROI estimate: revenue lifted vs plan cost (placeholder: assume $29/mo plan cost)
    const planCost = 29;
    const roiEstimate = planCost > 0 ? Math.round((totalRevenueLifted / planCost) * 100) / 100 : 0;

    // Time-bounded accepts
    // Accepts today
    let acceptsToday = 0;
    if (db.usePostgres) {
      const r = await db.query(`
        SELECT COUNT(*) as cnt FROM upsell_responses
        WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2
      `, [storeId, todayStart]);
      acceptsToday = parseInt(r.rows[0]?.cnt || 0);
    } else {
      const r = db.prepare(`
        SELECT COUNT(*) as cnt FROM upsell_responses
        WHERE store_id = ? AND response = 'accepted' AND created_at >= ?
      `).get(storeId, todayStart);
      acceptsToday = parseInt(r?.cnt || 0);
    }

    // Accepts this week
    let acceptsThisWeek = 0;
    if (db.usePostgres) {
      const r = await db.query(`
        SELECT COUNT(*) as cnt FROM upsell_responses
        WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2
      `, [storeId, weekStart]);
      acceptsThisWeek = parseInt(r.rows[0]?.cnt || 0);
    } else {
      const r = db.prepare(`
        SELECT COUNT(*) as cnt FROM upsell_responses
        WHERE store_id = ? AND response = 'accepted' AND created_at >= ?
      `).get(storeId, weekStart);
      acceptsThisWeek = parseInt(r?.cnt || 0);
    }

    // Accepts this month
    let acceptsThisMonth = 0;
    if (db.usePostgres) {
      const r = await db.query(`
        SELECT COUNT(*) as cnt FROM upsell_responses
        WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2
      `, [storeId, monthStart]);
      acceptsThisMonth = parseInt(r.rows[0]?.cnt || 0);
    } else {
      const r = db.prepare(`
        SELECT COUNT(*) as cnt FROM upsell_responses
        WHERE store_id = ? AND response = 'accepted' AND created_at >= ?
      `).get(storeId, monthStart);
      acceptsThisMonth = parseInt(r?.cnt || 0);
    }

    // Revenue today
    let revenueToday = 0;
    if (db.usePostgres) {
      const r = await db.query(`
        SELECT COALESCE(SUM(added_revenue), 0) as total FROM upsell_responses
        WHERE store_id = $1 AND response = 'accepted' AND created_at >= $2
      `, [storeId, todayStart]);
      revenueToday = parseFloat(r.rows[0]?.total || 0);
    } else {
      const r = db.prepare(`
        SELECT COALESCE(SUM(added_revenue), 0) as total FROM upsell_responses
        WHERE store_id = ? AND response = 'accepted' AND created_at >= ?
      `).get(storeId, todayStart);
      revenueToday = parseFloat(r?.total || 0);
    }

    res.json({
      accepts,
      declines,
      total_triggered: totalTriggered,
      total_responses: total,
      acceptance_rate: acceptanceRate,
      total_revenue_lifted: Math.round(totalRevenueLifted * 100) / 100,
      revenue_per_accept: revenuePerAccept,
      roi_estimate: roiEstimate,
      accepts_today: acceptsToday,
      accepts_this_week: acceptsThisWeek,
      accepts_this_month: acceptsThisMonth,
      revenue_today: Math.round(revenueToday * 100) / 100,
      store_id: storeId,
      revenue_lifted_trend: revenueLiftedTrend,
      accepts_trend: acceptsTrend,
      declines_trend: declinesTrend,
      rate_trend: rateTrend,
      triggered_trend: triggeredTrend,
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
      ? (await db.query(`
          SELECT r.id, r.order_id, r.offer_id, r.response, r.created_at, r.added_revenue,
                 o.offer_type, o.headline, o.message
          FROM upsell_responses r
          LEFT JOIN upsell_offers o ON r.offer_id = o.id
          WHERE r.store_id = $1
          ORDER BY r.created_at DESC
          LIMIT $2
        `, [req.store.id, limit])).rows
      : db.prepare(`
          SELECT r.id, r.order_id, r.offer_id, r.response, r.created_at, r.added_revenue,
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

// GET /api/dashboard/ab-groups
// Returns A/B test groups with variant stats
router.get('/ab-groups', verifyShop, async (req, res) => {
  try {
    const groups = db.usePostgres
      ? (await db.query(`
          SELECT g.*,
            (SELECT COUNT(*) FROM upsell_responses r WHERE r.offer_id = ANY(g.offer_ids) AND r.response = 'accepted') as total_accepts,
            (SELECT COUNT(*) FROM upsell_responses r WHERE r.offer_id = ANY(g.offer_ids) AND r.response = 'declined') as total_declines
          FROM upsell_ab_groups g
          WHERE g.store_id = $1
          ORDER BY g.created_at DESC
        `, [req.store.id])).rows
      : db.prepare(`
          SELECT g.* FROM upsell_ab_groups g
          WHERE g.store_id = ?
          ORDER BY g.created_at DESC
        `).all(req.store.id);

    // For each group, fetch variant details — batched to avoid N+1 queries
    const enrichedGroups = await Promise.all((groups || []).map(async (group) => {
      let offerIds;
      try {
        offerIds = db.usePostgres ? group.offer_ids : JSON.parse(group.offer_ids);
      } catch {
        offerIds = [];
      }

      if (!offerIds || offerIds.length === 0) {
        return { ...group, variants: [] };
      }

      // Batch-fetch all offers for this group in a single query
      let offers;
      if (db.usePostgres) {
        offers = (await db.query(`SELECT * FROM upsell_offers WHERE id = ANY($1)`, [offerIds])).rows;
      } else {
        const placeholders = offerIds.map(() => '?').join(',');
        offers = db.prepare(`SELECT * FROM upsell_offers WHERE id IN (${placeholders})`).all(...offerIds);
      }

      // Batch-fetch all stats for this group's offers in a single query
      let statsMap = {};
      if (db.usePostgres) {
        const stats = (await db.query(`
          SELECT offer_id, response, COUNT(*) as cnt FROM upsell_responses
          WHERE offer_id = ANY($1) GROUP BY offer_id, response
        `, [offerIds])).rows;
        for (const r of stats) {
          if (!statsMap[r.offer_id]) statsMap[r.offer_id] = { accepts: 0, declines: 0 };
          if (r.response === 'accepted') statsMap[r.offer_id].accepts = parseInt(r.cnt);
          if (r.response === 'declined') statsMap[r.offer_id].declines = parseInt(r.cnt);
        }
      } else {
        const placeholders = offerIds.map(() => '?').join(',');
        const stats = db.prepare(`
          SELECT offer_id, response, COUNT(*) as cnt FROM upsell_responses
          WHERE offer_id IN (${placeholders}) GROUP BY offer_id, response
        `).all(...offerIds);
        for (const r of stats) {
          if (!statsMap[r.offer_id]) statsMap[r.offer_id] = { accepts: 0, declines: 0 };
          if (r.response === 'accepted') statsMap[r.offer_id].accepts = parseInt(r.cnt);
          if (r.response === 'declined') statsMap[r.offer_id].declines = parseInt(r.cnt);
        }
      }

      const variants = offers.map(offer => ({
        ...offer,
        accepts: statsMap[offer.id]?.accepts || 0,
        declines: statsMap[offer.id]?.declines || 0,
      }));

      return { ...group, variants };
    }));

    res.json({ groups: enrichedGroups });
  } catch (e) {
    console.error('[/dashboard/ab-groups]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dashboard/analytics/chart
// Returns daily accept/decline counts and revenue for a time period
router.get('/analytics/chart', verifyShop, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString();

    // Daily accept/decline counts + revenue
    const rows = db.usePostgres
      ? await db.query(`
          SELECT
            DATE(r.created_at) as date,
            COUNT(*) as total,
            COUNT(CASE WHEN r.response = 'accepted' THEN 1 END) as accepted,
            COUNT(CASE WHEN r.response = 'declined' THEN 1 END) as declined,
            COALESCE(SUM(CASE WHEN r.response = 'accepted' THEN r.added_revenue ELSE 0 END), 0) as revenue
          FROM upsell_responses r
          WHERE r.store_id = $1 AND r.created_at >= $2
          GROUP BY DATE(r.created_at)
          ORDER BY date ASC
        `, [req.store.id, startStr])
      : db.prepare(`
          SELECT
            DATE(r.created_at) as date,
            COUNT(*) as total,
            COUNT(CASE WHEN r.response = 'accepted' THEN 1 END) as accepted,
            COUNT(CASE WHEN r.response = 'declined' THEN 1 END) as declined,
            COALESCE(SUM(CASE WHEN r.response = 'accepted' THEN r.added_revenue ELSE 0 END), 0) as revenue
          FROM upsell_responses r
          WHERE r.store_id = ? AND r.created_at >= ?
          GROUP BY DATE(r.created_at)
          ORDER BY date ASC
        `).all(req.store.id, startStr);

    const data = db.usePostgres ? rows.rows : rows;

    res.json({
      chart: data.map(row => ({
        date: row.date instanceof Date
          ? row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        accepted: parseInt(row.accepted) || 0,
        declined: parseInt(row.declined) || 0,
        revenue: parseFloat(row.revenue) || 0,
      })),
      period_days: days,
    });
  } catch (e) {
    console.error('[/dashboard/analytics/chart]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dashboard/analytics/offers
// Returns per-offer performance stats (triggered, accepted, declined, revenue) for a time period
router.get('/analytics/offers', verifyShop, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString();

    const rows = db.usePostgres
      ? await db.query(`
          SELECT
            r.offer_id,
            o.offer_type,
            o.headline,
            o.status,
            COUNT(*) as total_triggered,
            COUNT(CASE WHEN r.response = 'accepted' THEN 1 END) as total_accepted,
            COUNT(CASE WHEN r.response = 'declined' THEN 1 END) as total_declined,
            COALESCE(SUM(CASE WHEN r.response = 'accepted' THEN r.added_revenue ELSE 0 END), 0) as revenue_lifted
          FROM upsell_responses r
          LEFT JOIN upsell_offers o ON r.offer_id = o.id
          WHERE r.store_id = $1 AND r.created_at >= $2
          GROUP BY r.offer_id, o.offer_type, o.headline, o.status
          ORDER BY revenue_lifted DESC
        `, [req.store.id, startStr])
      : db.prepare(`
          SELECT
            r.offer_id,
            o.offer_type,
            o.headline,
            o.status,
            COUNT(*) as total_triggered,
            COUNT(CASE WHEN r.response = 'accepted' THEN 1 END) as total_accepted,
            COUNT(CASE WHEN r.response = 'declined' THEN 1 END) as total_declined,
            COALESCE(SUM(CASE WHEN r.response = 'accepted' THEN r.added_revenue ELSE 0 END), 0) as revenue_lifted
          FROM upsell_responses r
          LEFT JOIN upsell_offers o ON r.offer_id = o.id
          WHERE r.store_id = ? AND r.created_at >= ?
          GROUP BY r.offer_id, o.offer_type, o.headline, o.status
          ORDER BY revenue_lifted DESC
        `).all(req.store.id, startStr);

    const data = db.usePostgres ? rows.rows : rows;

    res.json({
      offers: data.map(row => ({
        id: row.offer_id,
        name: row.headline || `Offer #${row.offer_id}`,
        offer_type: row.offer_type || 'add_product',
        status: row.status || 'draft',
        total_triggered: parseInt(row.total_triggered) || 0,
        total_accepted: parseInt(row.total_accepted) || 0,
        total_declined: parseInt(row.total_declined) || 0,
        revenue_lifted: parseFloat(row.revenue_lifted) || 0,
      })),
      period_days: days,
    });
  } catch (e) {
    console.error('[/dashboard/analytics/offers]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;