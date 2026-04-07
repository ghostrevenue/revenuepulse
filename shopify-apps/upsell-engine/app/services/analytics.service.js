/**
 * RevenuePulse - Analytics Service
 * Tracks and analyzes upsell performance
 * 
 * Functions:
 * - trackOfferShown: Record when an offer was displayed
 * - trackOfferClicked: Record when an offer was clicked
 * - trackOfferAccepted: Record when an offer was accepted
 * - getAnalytics: Get dashboard analytics for a store
 */

import { 
  trackAnalyticsEvent, 
  recordOfferHistory,
  getAnalyticsSummary, 
  getTopOffers, 
  getFunnelData, 
  getRevenueAnalytics,
  getStore 
} from '../models/store.js';

/**
 * Track an offer being shown to a customer
 * 
 * @param {Object} params - {offerId, orderId, customerId, revenue, shopDomain}
 */
export async function trackOfferShown({ offerId, orderId, customerId, revenue = 0, shopDomain }) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    // Track the event
    await trackAnalyticsEvent({
      storeId: store.id,
      offerId,
      orderId: orderId?.toString(),
      customerId: customerId?.toString() || null,
      eventType: 'shown',
      revenue: 0
    });

    // Record in customer history
    await recordOfferHistory({
      storeId: store.id,
      customerId: customerId?.toString() || 'anonymous',
      offerId,
      eventType: 'shown'
    });

    console.log(`[Analytics] Tracked offer shown: offer=${offerId}, order=${orderId}`);
  } catch (error) {
    console.error('[Analytics] trackOfferShown error:', error);
    // Don't throw - analytics failures shouldn't break the flow
  }
}

/**
 * Track an offer being clicked by a customer
 * 
 * @param {Object} params - {offerId, orderId, customerId, shopDomain}
 */
export async function trackOfferClicked({ offerId, orderId, customerId, shopDomain }) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    await trackAnalyticsEvent({
      storeId: store.id,
      offerId,
      orderId: orderId?.toString(),
      customerId: customerId?.toString() || null,
      eventType: 'clicked',
      revenue: 0
    });

    await recordOfferHistory({
      storeId: store.id,
      customerId: customerId?.toString() || 'anonymous',
      offerId,
      eventType: 'clicked'
    });

    console.log(`[Analytics] Tracked offer clicked: offer=${offerId}, order=${orderId}`);
  } catch (error) {
    console.error('[Analytics] trackOfferClicked error:', error);
  }
}

/**
 * Track an offer being accepted/converted
 * 
 * @param {Object} params - {offerId, orderId, customerId, revenue, shopDomain}
 */
export async function trackOfferAccepted({ offerId, orderId, customerId, revenue = 0, shopDomain }) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    await trackAnalyticsEvent({
      storeId: store.id,
      offerId,
      orderId: orderId?.toString(),
      customerId: customerId?.toString() || null,
      eventType: 'converted',
      revenue: revenue || 0
    });

    await recordOfferHistory({
      storeId: store.id,
      customerId: customerId?.toString() || 'anonymous',
      offerId,
      eventType: 'converted'
    });

    console.log(`[Analytics] Tracked offer accepted: offer=${offerId}, order=${orderId}, revenue=${revenue}`);
  } catch (error) {
    console.error('[Analytics] trackOfferAccepted error:', error);
  }
}

/**
 * Get comprehensive analytics for a store
 * 
 * @param {string} shopDomain - Store domain
 * @param {Object} dateRange - {startDate, endDate}
 * @returns {Object} Analytics data
 */
export async function getAnalytics(shopDomain, dateRange = {}) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    // Default to last 30 days if not specified
    const endDate = dateRange.endDate || new Date().toISOString().split('T')[0];
    const startDate = dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all analytics data in parallel
    const [summary, topOffers, funnel, revenue] = await Promise.all([
      getAnalyticsSummary(store.id, startDate, endDate),
      getTopOffers(store.id, startDate, endDate, 10),
      getFunnelData(store.id, startDate, endDate),
      getRevenueAnalytics(store.id, startDate, endDate)
    ]);

    // Process summary into metrics
    const metrics = processSummary(summary);
    const funnelMetrics = processFunnel(funnel);
    const revenueMetrics = processRevenue(revenue);

    return {
      storeId: store.id,
      dateRange: { startDate, endDate },
      metrics: {
        ...metrics,
        ...funnelMetrics,
        ...revenueMetrics
      },
      topOffers: topOffers.map(formatOfferMetrics),
      funnel: funnel.map(formatFunnelDay),
      revenue: revenue.map(formatRevenueDay)
    };
  } catch (error) {
    console.error('[Analytics] getAnalytics error:', error);
    throw error;
  }
}

/**
 * Process summary data into metrics
 */
function processSummary(summary) {
  const data = {};
  
  for (const row of summary) {
    data[row.event_type] = {
      count: row.count,
      total_revenue: row.total_revenue || 0
    };
  }

  const shown = data.shown?.count || 0;
  const clicked = data.clicked?.count || 0;
  const converted = data.converted?.count || 0;
  const totalRevenue = data.converted?.total_revenue || 0;

  // Calculate rates
  const clickRate = shown > 0 ? (clicked / shown) * 100 : 0;
  const conversionRate = shown > 0 ? (converted / shown) * 100 : 0;
  const clickToConversionRate = clicked > 0 ? (converted / clicked) * 100 : 0;

  return {
    impressions: shown,
    clicks: clicked,
    conversions: converted,
    totalRevenue: totalRevenue,
    clickRate: Math.round(clickRate * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    clickToConversionRate: Math.round(clickToConversionRate * 100) / 100
  };
}

/**
 * Process funnel data for trends
 */
function processFunnel(funnel) {
  if (!funnel || funnel.length === 0) {
    return {
      dailyAverage: { shown: 0, clicked: 0, converted: 0 },
      trend: 'neutral'
    };
  }

  const totals = funnel.reduce((acc, day) => ({
    shown: acc.shown + day.shown,
    clicked: acc.clicked + day.clicked,
    converted: acc.converted + day.converted
  }), { shown: 0, clicked: 0, converted: 0 });

  const avgPerDay = {
    shown: Math.round(totals.shown / funnel.length),
    clicked: Math.round(totals.clicked / funnel.length),
    converted: Math.round(totals.converted / funnel.length)
  };

  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(funnel.length / 2);
  const firstHalf = funnel.slice(0, midpoint);
  const secondHalf = funnel.slice(midpoint);

  const firstHalfConvRate = firstHalf.length > 0 
    ? firstHalf.reduce((sum, d) => sum + d.converted, 0) / firstHalf.reduce((sum, d) => sum + d.shown, 0) * 100
    : 0;
  const secondHalfConvRate = secondHalf.length > 0 
    ? secondHalf.reduce((sum, d) => sum + d.converted, 0) / secondHalf.reduce((sum, d) => sum + d.shown, 0) * 100
    : 0;

  let trend = 'neutral';
  if (secondHalfConvRate > firstHalfConvRate * 1.1) {
    trend = 'improving';
  } else if (secondHalfConvRate < firstHalfConvRate * 0.9) {
    trend = 'declining';
  }

  return {
    dailyAverage: avgPerDay,
    trend,
    totalDays: funnel.length
  };
}

/**
 * Process revenue data
 */
function processRevenue(revenue) {
  if (!revenue || revenue.length === 0) {
    return {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalCustomers: 0
    };
  }

  const totals = revenue.reduce((acc, day) => ({
    revenue: acc.revenue + day.daily_revenue,
    orders: acc.orders + day.orders_with_upsell,
    customers: acc.customers + day.customers
  }), { revenue: 0, orders: 0, customers: 0 });

  return {
    totalRevenue: totals.revenue,
    averageOrderValue: totals.orders > 0 ? totals.revenue / totals.orders : 0,
    totalCustomers: totals.customers
  };
}

/**
 * Format offer metrics for display
 */
function formatOfferMetrics(offer) {
  const clickRate = offer.impressions > 0 
    ? (offer.clicks / offer.impressions) * 100 
    : 0;
  const conversionRate = offer.impressions > 0 
    ? (offer.conversions / offer.impressions) * 100 
    : 0;
  const conversionFromClick = offer.clicks > 0 
    ? (offer.conversions / offer.clicks) * 100 
    : 0;

  return {
    id: offer.id,
    name: offer.name,
    impressions: offer.impressions,
    clicks: offer.clicks,
    conversions: offer.conversions,
    revenue: offer.revenue || 0,
    clickRate: Math.round(clickRate * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    conversionFromClick: Math.round(conversionFromClick * 100) / 100
  };
}

/**
 * Format funnel day for display
 */
function formatFunnelDay(day) {
  return {
    date: day.date,
    shown: day.shown,
    clicked: day.clicked,
    converted: day.converted,
    clickRate: day.shown > 0 ? Math.round((day.clicked / day.shown) * 10000) / 100 : 0,
    conversionRate: day.shown > 0 ? Math.round((day.converted / day.shown) * 10000) / 100 : 0
  };
}

/**
 * Format revenue day for display
 */
function formatRevenueDay(day) {
  return {
    date: day.date,
    revenue: day.daily_revenue,
    orders: day.orders_with_upsell,
    customers: day.customers,
    averageOrderValue: day.orders_with_upsell > 0 
      ? day.daily_revenue / day.orders_with_upsell 
      : 0
  };
}

/**
 * Get a lightweight analytics snapshot (for real-time display)
 */
export async function getSnapshot(shopDomain) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    // Get last 7 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const summary = await getAnalyticsSummary(store.id, startDate, endDate);
    const metrics = processSummary(summary);

    return {
      impressions: metrics.impressions || 0,
      conversions: metrics.conversions || 0,
      conversionRate: metrics.conversionRate || 0,
      revenue: metrics.totalRevenue || 0
    };
  } catch (error) {
    console.error('[Analytics] getSnapshot error:', error);
    throw error;
  }
}

/**
 * Generic track event function
 */
export async function trackEvent({ offerId, orderId, customerId, eventType, revenue = 0, shopDomain }) {
  switch (eventType) {
    case 'shown':
      return trackOfferShown({ offerId, orderId, customerId, revenue, shopDomain });
    case 'clicked':
      return trackOfferClicked({ offerId, orderId, customerId, shopDomain });
    case 'converted':
      return trackOfferAccepted({ offerId, orderId, customerId, revenue, shopDomain });
    default:
      console.warn(`[Analytics] Unknown event type: ${eventType}`);
  }
}

export default {
  trackOfferShown,
  trackOfferClicked,
  trackOfferAccepted,
  getAnalytics,
  getSnapshot,
  trackEvent
};
