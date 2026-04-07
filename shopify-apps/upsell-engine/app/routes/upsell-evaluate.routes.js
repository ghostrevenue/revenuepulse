/**
 * RevenuePulse - Upsell Evaluate Routes
 * Handles upsell evaluation requests from checkout extension
 */

import express from 'express';
import { evaluateAllOffers, recordOfferShown } from '../services/offer.service.js';
import { fetchOrderProducts, getBestUpsellProduct, calculateUpsellPrice } from '../services/product.service.js';
import { trackOfferShown } from '../services/analytics.service.js';
import { getStore } from '../models/store.js';

const router = express.Router();

/**
 * POST /api/upsell/evaluate
 * Evaluate and return upsell decision for an order
 * Called from webhook and checkout extension
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { orderId, shopDomain } = req.body;

    if (!orderId || !shopDomain) {
      return res.status(400).json({ error: 'orderId and shopDomain are required' });
    }

    const store = getStore(shopDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Build order object from request (in real flow, this comes from webhook)
    const order = {
      id: orderId,
      shop_domain: shopDomain,
      customer: req.body.customer || { id: null, tags: '' },
      total_price: req.body.totalPrice || '0',
      line_items: req.body.lineItems || []
    };

    // Evaluate offers
    const result = await evaluateAllOffers(order, shopDomain);

    if (!result.show || !result.offer) {
      return res.json({
        show: false,
        reason: result.reason
      });
    }

    // Record the impression
    recordOfferShown(order, result.offer);

    await trackOfferShown({
      offerId: result.offer.id,
      orderId: orderId.toString(),
      customerId: req.body.customer?.id?.toString(),
      shopDomain
    });

    // Get upsell product
    const orderProducts = await fetchOrderProducts(orderId, shopDomain);
    const upsellProduct = await getBestUpsellProduct(orderProducts, result.offer, shopDomain);

    if (!upsellProduct) {
      return res.json({
        show: false,
        reason: 'No suitable upsell product found'
      });
    }

    // Calculate upsell price
    const pricingConfig = result.offer.product_config?.pricing_config || {};
    const upsellPrice = calculateUpsellPrice(upsellProduct.price, pricingConfig);

    // Build display config
    const displayConfig = result.offer.display_config || {};

    res.json({
      show: true,
      offerId: result.offer.id,
      offerName: result.offer.name,
      offerDescription: displayConfig.description || `You might also like: ${upsellProduct.title}`,
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
      displayConfig: {
        headline: displayConfig.headline || 'Add to your order',
        subheadline: displayConfig.subheadline || 'Exclusive deal just for you',
        ctaText: displayConfig.cta_text || 'Add to Order',
        dismissText: displayConfig.dismiss_text || 'No thanks'
      }
    });
  } catch (error) {
    console.error('[UpsellEvaluate] Error:', error);
    res.status(500).json({ error: 'Failed to evaluate upsell' });
  }
});

/**
 * POST /api/upsell/accept
 * Handle upsell acceptance (called when customer clicks "Add to Order")
 */
router.post('/accept', async (req, res) => {
  try {
    const { orderId, offerId, productId, variantId, shopDomain } = req.body;

    if (!orderId || !offerId || !productId || !shopDomain) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const store = getStore(shopDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // In a real implementation, this would:
    // 1. Call Shopify Orders API to add line item at upsell price
    // 2. Update order metafields to track the upsell
    // 3. Record the conversion

    // For now, return success (the actual implementation would make API calls)
    console.log(`[UpsellAccept] Order ${orderId}, Offer ${offerId}, Product ${productId} accepted`);

    res.json({
      success: true,
      message: 'Upsell added to order',
      addedLineItem: {
        orderId,
        productId,
        variantId
      }
    });
  } catch (error) {
    console.error('[UpsellAccept] Error:', error);
    res.status(500).json({ error: 'Failed to accept upsell' });
  }
});

/**
 * POST /api/upsell/dismiss
 * Handle upsell dismissal
 */
router.post('/dismiss', async (req, res) => {
  try {
    const { orderId, offerId, shopDomain } = req.body;

    // Log the dismissal for frequency capping purposes
    console.log(`[UpsellDismiss] Order ${orderId}, Offer ${offerId} dismissed`);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[UpsellDismiss] Error:', error);
    res.status(500).json({ error: 'Failed to record dismissal' });
  }
});

export default router;
