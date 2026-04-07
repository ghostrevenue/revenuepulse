import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getVisitors, getVisitorCount } from '../models/visitor.js';
import { getCampaigns } from '../models/campaign.js';
import { getDB } from '../models/db.js';

const router = Router();

// Dashboard summary stats
router.get('/dashboard', (req, res) => {
  const { store_id } = req.query;
  
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const db = getDB();
    
    // Visitor counts by status
    const totalVisitors = getVisitorCount(store_id);
    const abandonedVisitors = getVisitorCount(store_id, 'abandoned');
    const recoveredVisitors = getVisitorCount(store_id, 'recovered');
    const convertedVisitors = getVisitorCount(store_id, 'converted');
    
    // Email capture count
    const emailsCaptured = db.prepare(
      "SELECT COUNT(*) as count FROM visitors WHERE store_id = ? AND email IS NOT NULL AND email != ''"
    ).get(store_id).count;
    
    // Calculate rates
    const abandonmentRate = totalVisitors > 0 
      ? Math.round((abandonedVisitors / totalVisitors) * 100 * 10) / 10 
      : 0;
    const recoveryRate = abandonedVisitors > 0 
      ? Math.round((recoveredVisitors / abandonedVisitors) * 100 * 10) / 10 
      : 0;
    
    // Revenue recovered (sum of cart_value for recovered visitors)
    const revenueRecovered = db.prepare(
      "SELECT SUM(cart_value) as total FROM visitors WHERE store_id = ? AND status = 'recovered'"
    ).get(store_id).total || 0;
    
    // Campaign stats
    const campaigns = getCampaigns(store_id);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.stats?.impressions || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.stats?.conversions || 0), 0);
    
    res.json({
      total_visitors: totalVisitors,
      abandoned: abandonedVisitors,
      recovered: recoveredVisitors,
      converted: convertedVisitors,
      emails_captured: emailsCaptured,
      abandonment_rate: abandonmentRate,
      recovery_rate: recoveryRate,
      revenue_recovered: Math.round(revenueRecovered * 100) / 100,
      campaign_impressions: totalImpressions,
      campaign_conversions: totalConversions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Funnel data
router.get('/funnel', (req, res) => {
  const { store_id, period = '30d' } = req.query;
  
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const db = getDB();
    
    // Get funnel stages
    const total = getVisitorCount(store_id);
    const addedToCart = db.prepare(
      "SELECT COUNT(*) as count FROM visitors WHERE store_id = ? AND cart_value > 0"
    ).get(store_id).count;
    const abandoned = getVisitorCount(store_id, 'abandoned');
    const recovered = getVisitorCount(store_id, 'recovered');
    const converted = getVisitorCount(store_id, 'converted');
    
    res.json({
      funnel: {
        visited: total,
        added_to_cart: addedToCart,
        abandoned,
        recovered,
        converted
      },
      period
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Event tracking
router.post('/event', (req, res) => {
  const { store_id, visitor_id, event_type, event_data } = req.body;
  
  if (!store_id || !event_type) {
    return res.status(400).json({ error: 'Missing store_id or event_type' });
  }
  
  try {
    const db = getDB();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO analytics_events (id, store_id, visitor_id, event_type, event_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, store_id, visitor_id || null, event_type, JSON.stringify(event_data || {}));
    
    res.json({ ok: true, event_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
