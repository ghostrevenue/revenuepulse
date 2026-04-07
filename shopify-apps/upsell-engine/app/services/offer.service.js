/**
 * RevenuePulse - Offer Service
 * Rules engine for evaluating when to show upsell offers
 * 
 * evaluateOffer(order, offer) → {show: bool, reason: string}
 * 
 * Trigger conditions:
 * - min_order_value: Order total must meet minimum
 * - product_ids: Order must contain intersection of specified products
 * - customer_tags: Customer must have required tags
 * - frequency_cap: Seen count and cooldown days limits
 * - schedule: Active dates and days of week
 */

import { getActiveOffers, getCustomerOfferCount, getCustomerLastInteraction, recordOfferHistory, getStore } from '../models/store.js';

/**
 * Main evaluation function - determines if an offer should be shown
 * 
 * @param {Object} order - Shopify order object
 * @param {Object} offer - Offer configuration object
 * @param {Object} store - Store object
 * @returns {Object} {show: boolean, reason: string, offer: Object}
 */
export async function evaluateOffer(order, offer, store) {
  const reasons = [];
  let shouldShow = true;

  // Parse offer config if string
  const triggerConfig = typeof offer.trigger_config === 'string' 
    ? JSON.parse(offer.trigger_config) 
    : offer.trigger_config;
  const frequencyCap = typeof offer.frequency_cap === 'string' 
    ? JSON.parse(offer.frequency_cap) 
    : offer.frequency_cap;
  const schedule = typeof offer.schedule === 'string' 
    ? JSON.parse(offer.schedule) 
    : offer.schedule;

  // 1. Check offer status
  if (offer.status !== 'active') {
    return { show: false, reason: `Offer is ${offer.status}`, offer };
  }

  // 2. Check minimum order value
  if (triggerConfig.min_order_value) {
    const orderTotal = parseFloat(order.total_price || 0);
    if (orderTotal < triggerConfig.min_order_value) {
      return { 
        show: false, 
        reason: `Order total $${orderTotal} below minimum $${triggerConfig.min_order_value}`,
        offer 
      };
    }
    reasons.push(`Order total $${orderTotal} meets minimum`);
  }

  // 3. Check product intersection
  if (triggerConfig.product_ids && triggerConfig.product_ids.length > 0) {
    const orderProductIds = (order.line_items || []).map(item => 
      item.product_id?.toString()
    );
    const offerProductIds = triggerConfig.product_ids.map(id => id.toString());
    
    const hasIntersection = orderProductIds.some(id => 
      offerProductIds.includes(id)
    );
    
    if (!hasIntersection) {
      return { 
        show: false, 
        reason: 'No matching products in order',
        offer 
      };
    }
    reasons.push('Order contains matching products');
  }

  // 4. Check customer tags (exclusion)
  if (triggerConfig.excluded_tags && triggerConfig.excluded_tags.length > 0) {
    const customerTags = (order.customer?.tags || '').split(',').map(t => t.trim());
    const hasExcludedTag = customerTags.some(tag => 
      triggerConfig.excluded_tags.includes(tag)
    );
    
    if (hasExcludedTag) {
      return { 
        show: false, 
        reason: 'Customer has excluded tag',
        offer 
      };
    }
  }

  // 5. Check customer tags (inclusion - must have at least one)
  if (triggerConfig.required_tags && triggerConfig.required_tags.length > 0) {
    const customerTags = (order.customer?.tags || '').split(',').map(t => t.trim());
    const hasRequiredTag = customerTags.some(tag => 
      triggerConfig.required_tags.includes(tag)
    );
    
    if (!hasRequiredTag) {
      return { 
        show: false, 
        reason: 'Customer missing required tag',
        offer 
      };
    }
    reasons.push('Customer has required tag');
  }

  // 6. Check customer type (first-time buyer)
  if (triggerConfig.first_time_buyer === true) {
    const orderCount = order.customer?.orders_count || 0;
    if (orderCount > 0) {
      return { 
        show: false, 
        reason: 'Customer is not a first-time buyer',
        offer 
      };
    }
    reasons.push('First-time buyer');
  }

  // 7. Check frequency cap - seen count
  if (frequencyCap.max_seen_count !== undefined && frequencyCap.max_seen_count > 0) {
    const customerId = order.customer?.id?.toString() || order.customer?.email || 'anonymous';
    const seenCount = getCustomerOfferCount(store.id, customerId, offer.id);
    
    if (seenCount >= frequencyCap.max_seen_count) {
      return { 
        show: false, 
        reason: `Customer has seen this offer ${seenCount} times (max: ${frequencyCap.max_seen_count})`,
        offer 
      };
    }
  }

  // 8. Check frequency cap - cooldown days
  if (frequencyCap.cooldown_days !== undefined && frequencyCap.cooldown_days > 0) {
    const customerId = order.customer?.id?.toString() || order.customer?.email || 'anonymous';
    const lastInteraction = getCustomerLastInteraction(store.id, customerId, offer.id);
    
    if (lastInteraction && lastInteraction.last_shown) {
      const lastShownDate = new Date(lastInteraction.last_shown);
      const now = new Date();
      const daysSince = Math.floor((now - lastShownDate) / (1000 * 60 * 60 * 24));
      
      if (daysSince < frequencyCap.cooldown_days) {
        return { 
          show: false, 
          reason: `Cooldown period active (${frequencyCap.cooldown_days - daysSince} days remaining)`,
          offer 
        };
      }
    }
  }

  // 9. Check schedule - active dates
  if (schedule.start_date || schedule.end_date) {
    const now = new Date();
    
    if (schedule.start_date) {
      const startDate = new Date(schedule.start_date);
      if (now < startDate) {
        return { 
          show: false, 
          reason: `Offer starts ${schedule.start_date}`,
          offer 
        };
      }
    }
    
    if (schedule.end_date) {
      const endDate = new Date(schedule.end_date);
      if (now > endDate) {
        return { 
          show: false, 
          reason: `Offer ended ${schedule.end_date}`,
          offer 
        };
      }
    }
    reasons.push('Within active date range');
  }

  // 10. Check schedule - days of week
  if (schedule.days_of_week && schedule.days_of_week.length > 0) {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayMap[today];
    
    if (!schedule.days_of_week.includes(todayName)) {
      return { 
        show: false, 
        reason: `Offer not available on ${todayName}s`,
        offer 
      };
    }
    reasons.push(`Available on ${schedule.days_of_week.join(', ')}`);
  }

  // All checks passed - offer should be shown
  return { 
    show: true, 
    reason: reasons.length > 0 ? reasons.join(', ') : 'All conditions met',
    offer 
  };
}

/**
 * Evaluate all active offers for an order and return the best one
 * 
 * @param {Object} order - Shopify order object
 * @param {string} shopDomain - Shop domain
 * @returns {Object} Best offer to display or null
 */
export async function evaluateAllOffers(order, shopDomain) {
  const store = getStore(shopDomain);
  if (!store) {
    console.error(`[OfferService] Store not found: ${shopDomain}`);
    return null;
  }

  const activeOffers = getActiveOffers(store.id);
  
  if (activeOffers.length === 0) {
    return { show: false, reason: 'No active offers configured', offer: null };
  }

  // Evaluate each offer
  const results = [];
  for (const offer of activeOffers) {
    const result = await evaluateOffer(order, offer, store);
    results.push(result);
  }

  // Filter to only shows
  const showableOffers = results.filter(r => r.show);
  
  if (showableOffers.length === 0) {
    // Return the first failed result for debugging
    return results[0];
  }

  // If multiple offers qualify, prioritize by:
  // 1. Explicit priority field (if exists)
  // 2. Most restrictive (product-specific before general)
  // 3. Created date (newer first)
  showableOffers.sort((a, b) => {
    const aHasProducts = a.offer.trigger_config?.product_ids?.length > 0;
    const bHasProducts = b.offer.trigger_config?.product_ids?.length > 0;
    
    // Prioritize product-specific offers
    if (aHasProducts && !bHasProducts) return -1;
    if (!aHasProducts && bHasProducts) return 1;
    
    // Then by creation date (newer first)
    return new Date(b.offer.created_at) - new Date(a.offer.created_at);
  });

  return showableOffers[0];
}

/**
 * Record that an offer was shown to a customer
 */
export function recordOfferShown(order, offer) {
  const customerId = order.customer?.id?.toString() || order.customer?.email || 'anonymous';
  const store = getStore(order.shop_domain || order.domain);
  
  if (store) {
    recordOfferHistory({
      storeId: store.id,
      customerId,
      offerId: offer.id,
      eventType: 'shown'
    });
  }
}

/**
 * Record that a customer clicked on an offer
 */
export function recordOfferClicked(order, offer) {
  const customerId = order.customer?.id?.toString() || order.customer?.email || 'anonymous';
  const store = getStore(order.shop_domain || order.domain);
  
  if (store) {
    recordOfferHistory({
      storeId: store.id,
      customerId,
      offerId: offer.id,
      eventType: 'clicked'
    });
  }
}

/**
 * Record that a customer accepted/converted an offer
 */
export function recordOfferConverted(order, offer, revenue = 0) {
  const customerId = order.customer?.id?.toString() || order.customer?.email || 'anonymous';
  const store = getStore(order.shop_domain || order.domain);
  
  if (store) {
    recordOfferHistory({
      storeId: store.id,
      customerId,
      offerId: offer.id,
      eventType: 'converted'
    });
  }
}

export default {
  evaluateOffer,
  evaluateAllOffers,
  recordOfferShown,
  recordOfferClicked,
  recordOfferConverted
};
