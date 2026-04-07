import { getVisitors, updateVisitor, getVisitorCount } from '../models/visitor.js';
import { getCampaigns, incrementCampaignStats } from '../models/campaign.js';

export function detectCartAbandonment(visitor) {
  if (!visitor) return false;
  
  // Has cart items, not yet converted, and no recent activity
  const hasCart = visitor.cart_value > 0 || (visitor.cart_contents && visitor.cart_contents.length > 0);
  const isNotConverted = visitor.status !== 'converted' && visitor.status !== 'recovered';
  
  return hasCart && isNotConverted;
}

export function markVisitorAbandoned(visitorId) {
  return updateVisitor(visitorId, { status: 'abandoned' });
}

export function markVisitorRecovered(visitorId) {
  return updateVisitor(visitorId, { status: 'recovered' });
}

export function getAbandonmentStats(storeId) {
  const visitors = getVisitors(storeId);
  
  const total = visitors.length;
  const abandoned = visitors.filter(v => v.status === 'abandoned').length;
  const recovered = visitors.filter(v => v.status === 'recovered').length;
  const converted = visitors.filter(v => v.status === 'converted').length;
  
  const abandonmentRate = total > 0 ? (abandoned / total) * 100 : 0;
  const recoveryRate = abandoned > 0 ? (recovered / abandoned) * 100 : 0;
  
  return {
    total,
    abandoned,
    recovered,
    converted,
    abandonmentRate: Math.round(abandonmentRate * 10) / 10,
    recoveryRate: Math.round(recoveryRate * 10) / 10
  };
}

export function triggerRecoveryWebhook(storeId, visitor, campaignId) {
  // In production, this would send a webhook to Shopify Flow
  // to trigger email/SMS recovery sequences
  const webhookPayload = {
    event: 'cart_abandoned',
    store_id: storeId,
    visitor_id: visitor.id,
    email: visitor.email,
    phone: visitor.phone,
    cart_value: visitor.cart_value,
    cart_contents: visitor.cart_contents,
    campaign_id: campaignId,
    timestamp: new Date().toISOString()
  };
  
  console.log('[Recovery] Triggering webhook:', webhookPayload);
  
  // Return payload for external webhook handling
  return webhookPayload;
}

export function calculateRecoveryValue(visitor) {
  if (!visitor || !visitor.cart_value) return 0;
  
  // Recovery value is the cart value * recovery rate estimate
  const estimatedRecoveryRate = 0.15; // 15% of abandoned carts typically recover
  return visitor.cart_value * estimatedRecoveryRate;
}
