import express from 'express';
import db from '../models/db.js';

const router = express.Router();

router.get('/:storeId/overview', (req, res) => {
  const { storeId } = req.params;
  
  const todayEvents = db.prepare(`
    SELECT COUNT(*) as count FROM events 
    WHERE store_id = ? AND DATE(created_at) = DATE('now')
  `).get(storeId);

  const todayValue = db.prepare(`
    SELECT SUM(value) as total FROM events 
    WHERE store_id = ? AND DATE(created_at) = DATE('now')
  `).get(storeId);

  const totalEvents = db.prepare(`
    SELECT COUNT(*) as count FROM events WHERE store_id = ?
  `).get(storeId);

  const byEventType = db.prepare(`
    SELECT event_name, COUNT(*) as count 
    FROM events WHERE store_id = ? 
    GROUP BY event_name
  `).all(storeId);

  res.json({
    today_events: todayEvents?.count || 0,
    today_value: todayValue?.total || 0,
    total_events: totalEvents?.count || 0,
    by_event_type: byEventType
  });
});

router.get('/:storeId/roas', (req, res) => {
  const { storeId } = req.params;
  
  // In production, this would integrate with FB Ad Insights API
  // For now, return sample ROAS data based on tracked events
  const purchases = db.prepare(`
    SELECT SUM(value) as total, COUNT(*) as count 
    FROM events 
    WHERE store_id = ? AND event_name = 'Purchase'
  `).get(storeId);

  res.json({
    roas_by_campaign: [
      { campaign: 'Facebook Ads', purchases: purchases?.count || 0, value: purchases?.total || 0, roas: 0 },
      { campaign: 'Instagram Ads', purchases: 0, value: 0, roas: 0 }
    ],
    total_value: purchases?.total || 0,
    attribution_note: 'Connect Facebook Ad account to see actual ROAS data'
  });
});

router.get('/:storeId/timeline', (req, res) => {
  const { storeId } = req.params;
  const { days = 7 } = req.query;

  const timeline = db.prepare(`
    SELECT DATE(created_at) as date, event_name, COUNT(*) as count, SUM(value) as value
    FROM events 
    WHERE store_id = ? AND created_at >= DATE('now', '-${parseInt(days)} days')
    GROUP BY DATE(created_at), event_name
    ORDER BY date ASC
  `).all(storeId);

  res.json({ timeline });
});

export default router;
