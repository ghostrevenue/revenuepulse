import db from '../models/db.js';

export function getROASData(storeId) {
  // Get purchase events grouped by attributed campaign
  const purchases = db.prepare(`
    SELECT * FROM events 
    WHERE store_id = ? AND event_name = 'Purchase'
    ORDER BY created_at DESC
  `).all(storeId);

  // In production, this would integrate with FB Ad Insights API
  // For now, aggregate tracked purchase value
  const totalValue = purchases.reduce((sum, p) => sum + (p.value || 0), 0);
  const totalPurchases = purchases.length;

  return {
    total_purchases: totalPurchases,
    total_value: totalValue,
    average_order_value: totalPurchases > 0 ? (totalValue / totalPurchases) : 0,
    campaigns: [],
    attribution_note: 'Connect Facebook Ad account to enable ROAS attribution'
  };
}

export function getEventTimeline(storeId, days = 30) {
  return db.prepare(`
    SELECT 
      DATE(created_at) as date,
      event_name,
      COUNT(*) as count,
      SUM(value) as value
    FROM events 
    WHERE store_id = ? AND created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at), event_name
    ORDER BY date ASC
  `).all(storeId, days);
}

export function getEventFunnel(storeId) {
  const funnel = db.prepare(`
    SELECT event_name, COUNT(*) as count
    FROM events
    WHERE store_id = ? AND event_name IN ('PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase')
    GROUP BY event_name
  `).all(storeId);

  const stages = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'];
  const funnelData = stages.map(stage => {
    const found = funnel.find(f => f.event_name === stage);
    return { stage, count: found?.count || 0 };
  });

  return funnelData;
}
