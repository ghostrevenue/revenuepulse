/**
 * RevenuePulse - Webhook Service
 * Handles Shopify webhook events
 */

import { evaluateAllOffers, recordOfferShown, recordOfferConverted } from './offer.service.js';
import { fetchOrderProducts, getBestUpsellProduct, calculateUpsellPrice } from './product.service.js';
import { trackOfferShown, trackOfferAccepted } from './analytics.service.js';
import { getStore } from '../models/store.js';

/**
 * Handle Shopify webhook events
 * 
 * @param {string} eventType - The webhook event type
 * @param {Object} payload - The webhook payload
 * @param {string} shopDomain - The shop domain
 */
export async function handleWebhook(eventType, payload, shopDomain) {
  console.log(`[Webhook] Processing ${eventType} for ${shopDomain}`);

  switch (eventType) {
    case 'orders/create':
      return handleOrderCreated(payload, shopDomain);
    case 'orders/updated':
      return handleOrderUpdated(payload, shopDomain);
    default:
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
      return null;
  }
}

/**
 * Handle order creation - evaluate and potentially show upsell
 */
async function handleOrderCreated(order, shopDomain) {
  try {
    // Evaluate all active offers for this order
    const result = await evaluateAllOffers(order, shopDomain);

    if (!result.show || !result.offer) {
      console.log(`[Webhook] No qualifying offer for order ${order.id}`);
      return { shown: false, reason: result.reason };
    }

    // Record that offer was shown
    recordOfferShown(order, result.offer);

    // Track analytics
    await trackOfferShown({
      offerId: result.offer.id,
      orderId: order.id?.toString(),
      customerId: order.customer?.id?.toString(),
      shopDomain
    });

    // Get the best upsell product for this offer
    const orderProducts = await fetchOrderProducts(order.id, shopDomain);
    const upsellProduct = await getBestUpsellProduct(orderProducts, result.offer, shopDomain);

    if (!upsellProduct) {
      console.log(`[Webhook] No upsell product available for offer ${result.offer.id}`);
      return { shown: false, reason: 'No upsell product available' };
    }

    // Calculate the upsell price
    const pricingConfig = result.offer.product_config?.pricing_config || {};
    const upsellPrice = calculateUpsellPrice(upsellProduct.price, pricingConfig);

    // Return the upsell decision for the extension to display
    return {
      shown: true,
      offerId: result.offer.id,
      offerName: result.offer.name,
      product: {
        id: upsellProduct.id,
        variant_id: upsellProduct.variant_id,
        title: upsellProduct.title,
        image: upsellProduct.image,
        originalPrice: upsellProduct.price,
        upsellPrice: upsellPrice,
        savings: upsellProduct.price - upsellPrice,
        savingsPercentage: Math.round((1 - upsellPrice / upsellProduct.price) * 100)
      },
      displayConfig: result.offer.display_config || {},
      reason: result.reason
    };
  } catch (error) {
    console.error(`[Webhook] handleOrderCreated error:`, error);
    throw error;
  }
}

/**
 * Handle order update - check for upsell acceptance
 */
async function handleOrderUpdated(order, shopDomain) {
  try {
    // Check if this order has any new line items that might indicate upsell acceptance
    // In a real implementation, we would compare with previous order state
    // For now, we'll check if the order has our metafield indicating an upsell
    
    const hasUpsellMetafield = order.metafields?.some(m => 
      m.key === '_upsell_offer_id'
    );

    if (hasUpsellMetafield) {
      // Find the upsell offer ID from metafields
      const upsellMetafield = order.metafields.find(m => m.key === '_upsell_offer_id');
      
      if (upsellMetafield) {
        const offerId = parseInt(upsellMetafield.value, 10);
        
        // Calculate upsell revenue from additional line items
        const upsellRevenue = order.financial_status === 'paid' 
          ? parseFloat(order.total_price) - parseFloat(order.subtotal_price)
          : 0;

        // Record conversion
        recordOfferConverted(order, { id: offerId }, upsellRevenue);

        // Track analytics
        await trackOfferAccepted({
          offerId,
          orderId: order.id?.toString(),
          customerId: order.customer?.id?.toString(),
          revenue: upsellRevenue,
          shopDomain
        });

        console.log(`[Webhook] Recorded upsell conversion: offer=${offerId}, order=${order.id}, revenue=${upsellRevenue}`);
      }
    }

    return { processed: true };
  } catch (error) {
    console.error(`[Webhook] handleOrderUpdated error:`, error);
    throw error;
  }
}

export default { handleWebhook };
