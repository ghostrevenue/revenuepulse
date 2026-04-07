import { getVisitors, getVisitorCount } from '../models/visitor.js';
import { getCampaigns } from '../models/campaign.js';
import { getCoupons } from '../models/coupon.js';
import { getDB } from '../models/db.js';

export function getDashboardAnalytics(storeId) {
  const db = getDB();
  
  // Basic visitor stats
  const totalVisitors = getVisitorCount(storeId);
  const abandonedCount = getVisitorCount(storeId, 'abandoned');
  const recoveredCount = getVisitorCount(storeId, 'recovered');
  const convertedCount = getVisitorCount(storeId, 'converted');
  
  // Email stats
  const emailCount = db.prepare(`
    SELECT COUNT(*) as count FROM visitors 
    WHERE store_id = ? AND email IS NOT NULL AND email != ''
  `).get(storeId).count;
  
  // Revenue stats
  const revenueRecovered = db.prepare(`
    SELECT SUM(cart_value) as total FROM visitors 
    WHERE store_id = ? AND status IN ('recovered', 'converted')
  `).get(storeId).total || 0;
  
  // Campaign stats
  const campaigns = getCampaigns(storeId);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.stats?.impressions || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.stats?.conversions || 0), 0);
  
  // Calculate rates
  const abandonmentRate = totalVisitors > 0 
    ? Math.round((abandonedCount / totalVisitors) * 100 * 10) / 10 
    : 0;
  const recoveryRate = abandonedCount > 0 
    ? Math.round((recoveredCount / abandonedCount) * 100 * 10) / 10 
    : 0;
  const conversionRate = totalImpressions > 0 
    ? Math.round((totalConversions / totalImpressions) * 100 * 10) / 10 
    : 0;
  
  return {
    visitors: {
      total: totalVisitors,
      abandoned: abandonedCount,
      recovered: recoveredCount,
      converted: convertedCount,
      emails_captured: emailCount
    },
    revenue: {
      recovered: Math.round(revenueRecovered * 100) / 100
    },
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      impressions: totalImpressions,
      conversions: totalConversions,
      conversion_rate: conversionRate
    },
    rates: {
      abandonment: abandonmentRate,
      recovery: recoveryRate
    }
  };
}

export function getFunnelData(storeId, days = 30) {
  const db = getDB();
  
  // Get all visitors and group by funnel stage
  const visitors = getVisitors(storeId);
  
  const visited = visitors.length;
  const addedToCart = visitors.filter(v => v.cart_value > 0 || (v.cart_contents && v.cart_contents.length > 0)).length;
  const abandoned = visitors.filter(v => v.status === 'abandoned').length;
  const recovered = visitors.filter(v => v.status === 'recovered').length;
  const converted = visitors.filter(v => v.status === 'converted').length;
  
  // Calculate drop-off rates
  const cartDropOff = addedToCart > 0 ? ((addedToCart - abandoned - recovered - converted) / addedToCart) * 100 : 0;
  
  return {
    stages: {
      visited,
      added_to_cart: addedToCart,
      abandoned,
      recovered,
      converted
    },
    dropoff_rates: {
      visit_to_cart: visited > 0 ? Math.round(((visited - addedToCart) / visited) * 100 * 10) / 10 : 0,
      cart_to_abandon: cartDropOff
    },
    period_days: days
  };
}

export function getCampaignPerformance(storeId) {
  const campaigns = getCampaigns(storeId);
  
  return campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    impressions: campaign.stats?.impressions || 0,
    conversions: campaign.stats?.conversions || 0,
    revenue: campaign.stats?.revenue || 0,
    conversion_rate: campaign.stats?.impressions > 0 
      ? Math.round((campaign.stats.conversions / campaign.stats.impressions) * 100 * 10) / 10 
      : 0
  }));
}

export function getEmailCaptureStats(storeId) {
  const db = getDB();
  
  const totalVisitors = getVisitorCount(storeId);
  const withEmail = db.prepare(`
    SELECT COUNT(*) as count FROM visitors 
    WHERE store_id = ? AND email IS NOT NULL AND email != ''
  `).get(storeId).count;
  
  const captureRate = totalVisitors > 0 ? (withEmail / totalVisitors) * 100 : 0;
  
  // Get recent captures
  const recentCaptures = db.prepare(`
    SELECT email, captured_at, cart_value FROM visitors 
    WHERE store_id = ? AND email IS NOT NULL AND email != ''
    ORDER BY captured_at DESC LIMIT 10
  `).all(storeId);
  
  return {
    total_visitors: totalVisitors,
    emails_captured: withEmail,
    capture_rate: Math.round(captureRate * 10) / 10,
    recent_captures: recentCaptures
  };
}
