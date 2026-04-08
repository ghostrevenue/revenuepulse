import express from 'express';
import crypto from 'crypto';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

function verifyWebhook(req, res, next) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const shopDomain = req.headers['x-shopify-shop-domain'];
  if (!hmacHeader || !shopDomain) {
    return res.status(401).json({ error: 'Missing webhook headers' });
  }
  const secret = process.env.SHOPIFY_API_SECRET || '';
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
  if (hash !== hmacHeader) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  req.shopDomain = shopDomain;
  next();
}

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

// Log an upsell response
async function logResponse(storeId, orderId, offerId, response, addedRevenue = 0) {
  try {
    const offer = db.usePostgres
      ? await db.prepare('SELECT * FROM upsell_offers WHERE id = $1').get(offerId)
      : db.prepare('SELECT * FROM upsell_offers WHERE id = ?').get(offerId);

    const params = [storeId, String(orderId), offerId, response, offer?.offer_type || null, addedRevenue];
    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO upsell_responses (store_id, order_id, offer_id, response, offer_type, added_revenue)
        VALUES ($1, $2, $3, $4, $5, $6)
      `).run(...params);
    } else {
      db.prepare(`
        INSERT INTO upsell_responses (store_id, order_id, offer_id, response, offer_type, added_revenue)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(...params);
    }
  } catch (e) {
    console.error('[logResponse]', e.message);
  }
}

// Fetch order from Shopify
async function fetchShopifyOrder(shop, accessToken, orderId) {
  const res = await fetch(`https://${shop}/admin/api/2024-01/orders/${orderId}.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.order;
}

// ── GET /api/upsell/preview/:offerId ───────────────────────────────────────
// Public preview — no auth guard, returns offer as customer would see it
router.get('/preview/:offerId', async (req, res) => {
  const { offerId } = req.params;
  if (!offerId) return res.status(400).json({ error: 'offerId required' });

  await db.ensureReady();

  let offer;
  if (db.usePostgres) {
    offer = await db.prepare('SELECT * FROM upsell_offers WHERE id = $1').get(offerId);
  } else {
    offer = db.prepare('SELECT * FROM upsell_offers WHERE id = ?').get(offerId);
  }

  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  // Get store info for shop domain
  let store;
  if (db.usePostgres) {
    store = await db.prepare('SELECT * FROM stores WHERE id = $1').get(offer.store_id);
  } else {
    store = db.prepare('SELECT * FROM stores WHERE id = ?').get(offer.store_id);
  }

  if (!store) return res.status(404).json({ error: 'Store not found' });

  const shop = store.shop;

  // Fetch upsell product details if add_product or warranty type
  let product = null;
  if (['add_product', 'warranty'].includes(offer.offer_type) && offer.upsell_product_id) {
    try {
      const productRes = await fetch(`https://${shop}/admin/api/2024-01/products/${offer.upsell_product_id}.json`, {
        headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' }
      });
      if (productRes.ok) product = (await productRes.json()).product;
    } catch (e) {
      console.error('[preview] Product fetch error:', e.message);
    }
  }

  res.json({
    offer: {
      id: offer.id,
      offer_type: offer.offer_type,
      headline: offer.headline || 'Special offer just for you!',
      message: offer.message || 'Add something special to your order!',
      product: product ? {
        id: product.id,
        title: product.title,
        price: product.variants?.[0]?.price,
        image: product.images?.[0]?.src,
        variant_id: product.variants?.[0]?.id
      } : null,
      discount_code: offer.upsell_discount_code || null,
      discount_value: offer.upsell_discount_value,
      upsell_price: product?.variants?.[0]?.price,
      store: {
        shop: shop,
        name: product?.vendor || shop
      }
    }
  });
});

// ── GET /api/upsell/offers ─────────────────────────────────────────────────────
// List all offers for a store
router.get('/offers', verifyShop, async (req, res) => {
  try {
    const offers = db.usePostgres
      ? await db.prepare('SELECT * FROM upsell_offers WHERE store_id = $1 ORDER BY created_at DESC').all(req.store.id)
      : db.prepare('SELECT * FROM upsell_offers WHERE store_id = ? ORDER BY created_at DESC').all(req.store.id);
    res.json({ offers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/upsell/offers ────────────────────────────────────────────────────
// Create a new upsell offer (status defaults to 'draft')
router.post('/offers', verifyShop, async (req, res) => {
  const {
    name,
    offer_type, trigger_min_amount, trigger_product_ids,
    upsell_product_id, upsell_discount_code, upsell_discount_value,
    headline, message, active,
    ab_variant_group_id, traffic_split,
    fallback_for_offer_id,
    // Rich targeting
    status, target_type,
    include_product_ids, include_collection_ids, include_tags,
    exclude_product_ids, exclude_collection_ids, exclude_tags,
    target_first_time_customer, target_customer_tags,
    trigger_max_amount, target_collection_ids,
    // Legacy
    target_tags,
    // Multi-item flow paths
    accept_path_items,
    decline_path_items
  } = req.body;

  if (!offer_type) return res.status(400).json({ error: 'offer_type is required' });
  if (!['add_product', 'discount', 'warranty'].includes(offer_type)) {
    return res.status(400).json({ error: 'offer_type must be "add_product", "discount", or "warranty"' });
  }

  try {
    const storeId = req.store.id;
    const triggerJson = trigger_product_ids ? JSON.stringify(trigger_product_ids) : null;
    const activeVal = active !== undefined ? (active ? 1 : 0) : 1;
    const statusVal = status || 'draft';
    const targetTypeVal = target_type || 'any';

    // JSON array fields
    const includeProductIds = include_product_ids
      ? (Array.isArray(include_product_ids) ? JSON.stringify(include_product_ids) : include_product_ids)
      : null;
    const includeCollectionIds = include_collection_ids
      ? (Array.isArray(include_collection_ids) ? JSON.stringify(include_collection_ids) : include_collection_ids)
      : null;
    const includeTags = include_tags
      ? (Array.isArray(include_tags) ? JSON.stringify(include_tags) : include_tags)
      : null;
    const excludeProductIds = exclude_product_ids
      ? (Array.isArray(exclude_product_ids) ? JSON.stringify(exclude_product_ids) : exclude_product_ids)
      : null;
    const excludeCollectionIds = exclude_collection_ids
      ? (Array.isArray(exclude_collection_ids) ? JSON.stringify(exclude_collection_ids) : exclude_collection_ids)
      : null;
    const excludeTags = exclude_tags
      ? (Array.isArray(exclude_tags) ? JSON.stringify(exclude_tags) : exclude_tags)
      : null;
    const targetCustomerTags = target_customer_tags
      ? (Array.isArray(target_customer_tags) ? JSON.stringify(target_customer_tags) : target_customer_tags)
      : null;
    const targetCollectionIds = target_collection_ids
      ? (Array.isArray(target_collection_ids) ? JSON.stringify(target_collection_ids) : target_collection_ids)
      : (target_tags ? target_tags : null); // fallback to legacy target_tags

    // Multi-item flow: serialize accept/decline path items
    const acceptPathItems = accept_path_items
      ? (Array.isArray(accept_path_items) ? JSON.stringify(accept_path_items) : accept_path_items)
      : null;
    const declinePathItems = decline_path_items
      ? (Array.isArray(decline_path_items) ? JSON.stringify(decline_path_items) : decline_path_items)
      : null;

    const params = [
      storeId, name || null, offer_type,
      trigger_min_amount || 0,
      triggerJson,
      upsell_product_id || null,
      upsell_discount_code || null,
      upsell_discount_value || null,
      headline || null,
      message || null,
      activeVal,
      ab_variant_group_id || null,
      traffic_split !== undefined ? traffic_split : 100,
      fallback_for_offer_id || null,
      statusVal,
      targetTypeVal,
      includeProductIds,
      includeCollectionIds,
      includeTags,
      excludeProductIds,
      excludeCollectionIds,
      excludeTags,
      target_first_time_customer ? 1 : 0,
      targetCustomerTags,
      trigger_max_amount || 0,
      targetCollectionIds,
      acceptPathItems,
      declinePathItems
    ];

    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO upsell_offers
          (store_id, name, offer_type, trigger_min_amount, trigger_product_ids,
           upsell_product_id, upsell_discount_code, upsell_discount_value,
           headline, message, active, ab_variant_group_id, traffic_split, fallback_for_offer_id,
           status, target_type,
           include_product_ids, include_collection_ids, include_tags,
           exclude_product_ids, exclude_collection_ids, exclude_tags,
           target_first_time_customer, target_customer_tags,
           trigger_max_amount, target_collection_ids,
           accept_path_items, decline_path_items)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      `).run(...params);
      const offer = await db.prepare('SELECT * FROM upsell_offers WHERE id = (SELECT MAX(id) FROM upsell_offers WHERE store_id = $1)').get(storeId);
      return res.json({ offer });
    } else {
      db.prepare(`
        INSERT INTO upsell_offers
          (store_id, name, offer_type, trigger_min_amount, trigger_product_ids,
           upsell_product_id, upsell_discount_code, upsell_discount_value,
           headline, message, active, ab_variant_group_id, traffic_split, fallback_for_offer_id,
           status, target_type,
           include_product_ids, include_collection_ids, include_tags,
           exclude_product_ids, exclude_collection_ids, exclude_tags,
           target_first_time_customer, target_customer_tags,
           trigger_max_amount, target_collection_ids,
           accept_path_items, decline_path_items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...params);
      const offer = db.prepare('SELECT * FROM upsell_offers WHERE id = last_insert_rowid()').get();
      return res.json({ offer });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/upsell/offers/:id ────────────────────────────────────────────────
router.get('/offers/:id', verifyShop, async (req, res) => {
  try {
    const offer = db.usePostgres
      ? await db.prepare('SELECT * FROM upsell_offers WHERE id = $1 AND store_id = $2').get(req.params.id, req.store.id)
      : db.prepare('SELECT * FROM upsell_offers WHERE id = ? AND store_id = ?').get(req.params.id, req.store.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    res.json({ offer });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/upsell/offers/:id ────────────────────────────────────────────────
// Update an offer (cannot update archived offers)
router.put('/offers/:id', verifyShop, async (req, res) => {
  const {
    name,
    offer_type, trigger_min_amount, trigger_product_ids,
    upsell_product_id, upsell_discount_code, upsell_discount_value,
    headline, message, active,
    ab_variant_group_id, traffic_split,
    fallback_for_offer_id,
    // Rich targeting
    status, target_type,
    include_product_ids, include_collection_ids, include_tags,
    exclude_product_ids, exclude_collection_ids, exclude_tags,
    target_first_time_customer, target_customer_tags,
    trigger_max_amount, target_collection_ids,
    // Legacy
    target_tags,
    // Multi-item flow paths
    accept_path_items,
    decline_path_items
  } = req.body;

  try {
    const existing = db.usePostgres
      ? await db.prepare('SELECT * FROM upsell_offers WHERE id = $1 AND store_id = $2').get(req.params.id, req.store.id)
      : db.prepare('SELECT * FROM upsell_offers WHERE id = ? AND store_id = ?').get(req.params.id, req.store.id);
    if (!existing) return res.status(404).json({ error: 'Offer not found' });
    if (existing.status === 'archived') {
      return res.status(403).json({ error: 'Cannot edit an archived offer. Duplicate it to create a new one.' });
    }

    const triggerJson = trigger_product_ids ? JSON.stringify(trigger_product_ids) : existing.trigger_product_ids;
    const activeVal = active !== undefined ? (active ? 1 : 0) : existing.active;

    // JSON array fields - serialize if arrays passed
    const includeProductIds = include_product_ids !== undefined
      ? (Array.isArray(include_product_ids) ? JSON.stringify(include_product_ids) : include_product_ids)
      : existing.include_product_ids;
    const includeCollectionIds = include_collection_ids !== undefined
      ? (Array.isArray(include_collection_ids) ? JSON.stringify(include_collection_ids) : include_collection_ids)
      : existing.include_collection_ids;
    const includeTags = include_tags !== undefined
      ? (Array.isArray(include_tags) ? JSON.stringify(include_tags) : include_tags)
      : existing.include_tags;
    const excludeProductIds = exclude_product_ids !== undefined
      ? (Array.isArray(exclude_product_ids) ? JSON.stringify(exclude_product_ids) : exclude_product_ids)
      : existing.exclude_product_ids;
    const excludeCollectionIds = exclude_collection_ids !== undefined
      ? (Array.isArray(exclude_collection_ids) ? JSON.stringify(exclude_collection_ids) : exclude_collection_ids)
      : existing.exclude_collection_ids;
    const excludeTags = exclude_tags !== undefined
      ? (Array.isArray(exclude_tags) ? JSON.stringify(exclude_tags) : exclude_tags)
      : existing.exclude_tags;
    const targetCustomerTags = target_customer_tags !== undefined
      ? (Array.isArray(target_customer_tags) ? JSON.stringify(target_customer_tags) : target_customer_tags)
      : existing.target_customer_tags;
    const targetCollectionIds = target_collection_ids !== undefined
      ? (Array.isArray(target_collection_ids) ? JSON.stringify(target_collection_ids) : target_collection_ids)
      : (target_tags ? target_tags : existing.target_collection_ids);

    // Multi-item flow: serialize accept/decline path items
    const acceptPathItems = accept_path_items !== undefined
      ? (Array.isArray(accept_path_items) ? JSON.stringify(accept_path_items) : accept_path_items)
      : existing.accept_path_items;
    const declinePathItems = decline_path_items !== undefined
      ? (Array.isArray(decline_path_items) ? JSON.stringify(decline_path_items) : decline_path_items)
      : existing.decline_path_items;

    const params = [
      name ?? existing.name,
      offer_type ?? existing.offer_type,
      trigger_min_amount ?? existing.trigger_min_amount,
      triggerJson,
      upsell_product_id ?? existing.upsell_product_id,
      upsell_discount_code ?? existing.upsell_discount_code,
      upsell_discount_value ?? existing.upsell_discount_value,
      headline ?? existing.headline,
      message ?? existing.message,
      activeVal,
      ab_variant_group_id ?? existing.ab_variant_group_id,
      traffic_split !== undefined ? traffic_split : existing.traffic_split,
      fallback_for_offer_id ?? existing.fallback_for_offer_id,
      status ?? existing.status,
      target_type ?? existing.target_type ?? 'any',
      includeProductIds,
      includeCollectionIds,
      includeTags,
      excludeProductIds,
      excludeCollectionIds,
      excludeTags,
      target_first_time_customer !== undefined ? (target_first_time_customer ? 1 : 0) : (existing.target_first_time_customer ?? 0),
      targetCustomerTags,
      trigger_max_amount ?? existing.trigger_max_amount ?? 0,
      targetCollectionIds,
      acceptPathItems,
      declinePathItems,
      req.params.id,
      req.store.id
    ];

    if (db.usePostgres) {
      await db.prepare(`
        UPDATE upsell_offers SET
          name = $1,
          offer_type = $2, trigger_min_amount = $3, trigger_product_ids = $4,
          upsell_product_id = $5, upsell_discount_code = $6, upsell_discount_value = $7,
          headline = $8, message = $9, active = $10,
          ab_variant_group_id = $11, traffic_split = $12, fallback_for_offer_id = $13,
          status = $14, target_type = $15,
          include_product_ids = $16, include_collection_ids = $17, include_tags = $18,
          exclude_product_ids = $19, exclude_collection_ids = $20, exclude_tags = $21,
          target_first_time_customer = $22, target_customer_tags = $23,
          trigger_max_amount = $24, target_collection_ids = $25,
          accept_path_items = $26, decline_path_items = $27,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $28 AND store_id = $29
      `).run(...params);
    } else {
      db.prepare(`
        UPDATE upsell_offers SET
          name = ?,
          offer_type = ?, trigger_min_amount = ?, trigger_product_ids = ?,
          upsell_product_id = ?, upsell_discount_code = ?, upsell_discount_value = ?,
          headline = ?, message = ?, active = ?,
          ab_variant_group_id = ?, traffic_split = ?, fallback_for_offer_id = ?,
          status = ?, target_type = ?,
          include_product_ids = ?, include_collection_ids = ?, include_tags = ?,
          exclude_product_ids = ?, exclude_collection_ids = ?, exclude_tags = ?,
          target_first_time_customer = ?, target_customer_tags = ?,
          trigger_max_amount = ?, target_collection_ids = ?,
          accept_path_items = ?, decline_path_items = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND store_id = ?
      `).run(...params);
    }

    const updated = db.usePostgres
      ? await db.prepare('SELECT * FROM upsell_offers WHERE id = $1').get(req.params.id)
      : db.prepare('SELECT * FROM upsell_offers WHERE id = ?').get(req.params.id);
    res.json({ offer: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/upsell/offers/:id ─────────────────────────────────────────────
// Soft-delete (archive) an offer — set status to 'archived'
router.delete('/offers/:id', verifyShop, async (req, res) => {
  const { hard } = req.query; // ?hard=1 to permanently delete
  try {
    if (hard === '1') {
      // Hard delete
      if (db.usePostgres) {
        await db.prepare('DELETE FROM upsell_offers WHERE id = $1 AND store_id = $2').run(req.params.id, req.store.id);
      } else {
        db.prepare('DELETE FROM upsell_offers WHERE id = ? AND store_id = ?').run(req.params.id, req.store.id);
      }
      return res.json({ success: true, deleted: 'hard' });
    } else {
      // Soft delete — archive the offer
      if (db.usePostgres) {
        await db.prepare("UPDATE upsell_offers SET status = 'archived', active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND store_id = $2").run(req.params.id, req.store.id);
      } else {
        db.prepare("UPDATE upsell_offers SET status = 'archived', active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?").run(req.params.id, req.store.id);
      }
      return res.json({ success: true, deleted: 'archived' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/upsell/ab/:groupId ───────────────────────────────────────────────
// Get A/B variant for this session — returns winning variant or split variant
router.get('/ab/:groupId', async (req, res) => {
  const { groupId } = req.params;
  if (!groupId) return res.status(400).json({ error: 'groupId required' });

  await db.ensureReady();

  // Get the A/B group
  let group;
  if (db.usePostgres) {
    group = await db.prepare('SELECT * FROM upsell_ab_groups WHERE id = $1').get(groupId);
  } else {
    group = db.prepare('SELECT * FROM upsell_ab_groups WHERE id = ?').get(groupId);
  }

  if (!group) return res.status(404).json({ error: 'A/B test group not found' });

  // If test is completed and has a winner, return the winner
  if (group.status === 'completed' && group.winner_id) {
    let winner;
    if (db.usePostgres) {
      winner = await db.prepare('SELECT * FROM upsell_offers WHERE id = $1').get(group.winner_id);
    } else {
      winner = db.prepare('SELECT * FROM upsell_offers WHERE id = ?').get(group.winner_id);
    }
    return res.json({ offer: winner, variant: 'winner', group_id: groupId });
  }

  // Parse offer_ids
  let offerIds;
  try {
    offerIds = db.usePostgres ? group.offer_ids : JSON.parse(group.offer_ids);
  } catch {
    return res.status(500).json({ error: 'Invalid offer_ids format' });
  }

  if (!offerIds || offerIds.length < 2) {
    return res.status(400).json({ error: 'A/B group must have at least 2 variants' });
  }

  // Get both offers
  const offers = [];
  for (const id of offerIds) {
    let offer;
    if (db.usePostgres) {
      offer = await db.prepare('SELECT * FROM upsell_offers WHERE id = $1').get(id);
    } else {
      offer = db.prepare('SELECT * FROM upsell_offers WHERE id = ?').get(id);
    }
    if (offer) offers.push(offer);
  }

  if (offers.length < 2) {
    return res.status(400).json({ error: 'Both variants must exist' });
  }

  // Use traffic_split from the first offer (variant A) to determine split
  const variantA = offers.find(o => o.traffic_split !== undefined) || offers[0];
  const split = variantA.traffic_split || 100;

  // Simple split: use random dice roll
  const roll = Math.random() * 100;
  const selectedVariant = roll < split ? offers[0] : offers[1];
  const variantLabel = roll < split ? 'A' : 'B';

  res.json({
    offer: selectedVariant,
    variant: variantLabel,
    group_id: groupId
  });
});

// ── POST /api/upsell/ab/:groupId/complete ─────────────────────────────────────
// Mark A/B test as done, set winner
router.post('/ab/:groupId/complete', verifyShop, async (req, res) => {
  const { groupId } = req.params;
  const { winner_id } = req.body;
  if (!groupId) return res.status(400).json({ error: 'groupId required' });
  if (!winner_id) return res.status(400).json({ error: 'winner_id required' });

  await db.ensureReady();

  try {
    if (db.usePostgres) {
      await db.prepare(`
        UPDATE upsell_ab_groups SET winner_id = $1, status = 'completed'
        WHERE id = $2 AND store_id = $3
      `).run(winner_id, groupId, req.store.id);
    } else {
      db.prepare(`
        UPDATE upsell_ab_groups SET winner_id = ?, status = 'completed'
        WHERE id = ? AND store_id = ?
      `).run(winner_id, groupId, req.store.id);
    }
    res.json({ success: true, group_id: groupId, winner_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/upsell/ab/create ────────────────────────────────────────────────
// Create A/B test: clones an offer as variant B
router.post('/ab/create', verifyShop, async (req, res) => {
  const { offer_id, traffic_split = 50 } = req.body;
  if (!offer_id) return res.status(400).json({ error: 'offer_id required' });

  await db.ensureReady();

  // Get original offer
  let original;
  if (db.usePostgres) {
    original = await db.prepare('SELECT * FROM upsell_offers WHERE id = $1 AND store_id = $2').get(offer_id, req.store.id);
  } else {
    original = db.prepare('SELECT * FROM upsell_offers WHERE id = ? AND store_id = ?').get(offer_id, req.store.id);
  }

  if (!original) return res.status(404).json({ error: 'Offer not found' });

  try {
    // Generate a new group ID
    const groupId = crypto.randomUUID();

    // Update original as variant A with traffic_split
    if (db.usePostgres) {
      await db.prepare(`
        UPDATE upsell_offers SET ab_variant_group_id = $1, traffic_split = $2 WHERE id = $3
      `).run(groupId, traffic_split, offer_id);
    } else {
      db.prepare(`
        UPDATE upsell_offers SET ab_variant_group_id = ?, traffic_split = ? WHERE id = ?
      `).run(groupId, traffic_split, offer_id);
    }

    // Create variant B as a clone
    const variantBParams = [
      req.store.id, original.offer_type,
      original.trigger_min_amount, original.trigger_product_ids,
      original.upsell_product_id, original.upsell_discount_code, original.upsell_discount_value,
      original.headline, original.message, original.active,
      groupId, 100 - traffic_split, null
    ];

    let variantBId;
    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO upsell_offers
          (store_id, offer_type, trigger_min_amount, trigger_product_ids,
           upsell_product_id, upsell_discount_code, upsell_discount_value,
           headline, message, active, ab_variant_group_id, traffic_split, fallback_for_offer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `).run(...variantBParams);
      const variantB = await db.prepare('SELECT * FROM upsell_offers WHERE id = (SELECT MAX(id) FROM upsell_offers WHERE store_id = $1)').get(req.store.id);
      variantBId = variantB?.id;
    } else {
      db.prepare(`
        INSERT INTO upsell_offers
          (store_id, offer_type, trigger_min_amount, trigger_product_ids,
           upsell_product_id, upsell_discount_code, upsell_discount_value,
           headline, message, active, ab_variant_group_id, traffic_split, fallback_for_offer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...variantBParams);
      const variantB = db.prepare('SELECT * FROM upsell_offers WHERE id = last_insert_rowid()').get();
      variantBId = variantB?.id;
    }

    // Create the A/B group
    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO upsell_ab_groups (store_id, offer_ids, status)
        VALUES ($1, $2, 'active')
      `).run(req.store.id, [offer_id, variantBId]);
    } else {
      db.prepare(`
        INSERT INTO upsell_ab_groups (id, store_id, offer_ids, status)
        VALUES (?, ?, ?, 'active')
      `).run(groupId, req.store.id, JSON.stringify([offer_id, variantBId]));
    }

    res.json({
      success: true,
      group_id: groupId,
      variant_a_id: offer_id,
      variant_b_id: variantBId,
      traffic_split
    });
  } catch (e) {
    console.error('[/ab/create]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/upsell/check/:order_id ───────────────────────────────────────────
// Check if an order qualifies for an upsell; return best matching offer
router.get('/check/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { shop } = req.query;
  if (!order_id || !shop) return res.status(400).json({ error: 'order_id and shop are required' });

  await db.ensureReady();
  const store = await StoreModel.findByShop(shop);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  // Check if already responded (limit to 2 offers per session)
  let existingCount;
  if (db.usePostgres) {
    existingCount = await db.prepare(
      'SELECT COUNT(*) as cnt FROM upsell_responses WHERE order_id = $1 AND store_id = $2 AND response IN ($3, $4)'
    ).get(String(order_id), store.id, 'accepted', 'declined');
  } else {
    existingCount = db.prepare(
      'SELECT COUNT(*) as cnt FROM upsell_responses WHERE order_id = ? AND store_id = ? AND response IN (?, ?)'
    ).get(String(order_id), store.id, 'accepted', 'declined');
  }

  const prevResponses = existingCount?.cnt || 0;
  if (prevResponses >= 2) {
    return res.json({ offer: null, reason: 'max_offers_reached' });
  }

  // Fetch order from Shopify
  const order = await fetchShopifyOrder(shop, store.access_token, order_id);
  if (!order) return res.status(404).json({ offer: null, reason: 'order_not_found' });

  const totalPrice = parseFloat(order.total_price || 0);
  const lineItemIds = (order.line_items || []).map(li => String(li.product_id));
  const lineItemCollectionIds = []; // We'll resolve collections if needed

  // Fetch customer for first-time customer check
  let customer = null;
  if (order.customer && order.customer.id) {
    try {
      const custRes = await fetch(`https://${shop}/admin/api/2024-01/customers/${order.customer.id}.json`, {
        headers: { 'X-Shopify-Access-Token': store.access_token }
      });
      if (custRes.ok) customer = (await custRes.json()).customer;
    } catch (e) {
      console.error('[check] Customer fetch error:', e.message);
    }
  }

  // Find PUBLISHED offers matching the order criteria
  let offers;
  if (db.usePostgres) {
    offers = await db.prepare(`
      SELECT * FROM upsell_offers
      WHERE store_id = $1 AND status = 'published' AND active = 1
      AND trigger_min_amount <= $2
      AND (fallback_for_offer_id IS NULL OR fallback_for_offer_id = '')
      ORDER BY trigger_min_amount DESC
    `).all(store.id, totalPrice);
  } else {
    offers = db.prepare(`
      SELECT * FROM upsell_offers
      WHERE store_id = ? AND status = 'published' AND active = 1
      AND trigger_min_amount <= ?
      AND (fallback_for_offer_id IS NULL OR fallback_for_offer_id = '')
      ORDER BY trigger_min_amount DESC
    `).all(store.id, totalPrice);
  }

  // Helper: parse JSON array field
  function parseJsonField(field) {
    if (!field) return [];
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  // Helper: check if order contains any of the target items
  function orderContainsAny(targetIds) {
    if (!targetIds || targetIds.length === 0) return true;
    return targetIds.some(id => lineItemIds.includes(String(id)));
  }

  // Helper: check if order contains all of the target items (for target_type = 'all')
  function orderContainsAll(targetIds) {
    if (!targetIds || targetIds.length === 0) return true;
    return targetIds.every(id => lineItemIds.includes(String(id)));
  }

  // Find best matching offer with rich targeting
  const matchingOffer = offers.find(offer => {
    // Check trigger_max_amount (optional upper threshold)
    if (offer.trigger_max_amount && offer.trigger_max_amount > 0) {
      if (totalPrice > offer.trigger_max_amount) return false;
    }

    // Parse targeting fields
    const includeProductIds = parseJsonField(offer.include_product_ids);
    const includeCollectionIds = parseJsonField(offer.include_collection_ids);
    const includeTags = parseJsonField(offer.include_tags);
    const excludeProductIds = parseJsonField(offer.exclude_product_ids);
    const excludeCollectionIds = parseJsonField(offer.exclude_collection_ids);
    const excludeTags = parseJsonField(offer.exclude_tags);
    const targetType = offer.target_type || 'any';

    // Check EXCLUDE rules first — if ANY exclude matches, skip this offer
    if (excludeProductIds.length > 0 && orderContainsAny(excludeProductIds)) return false;
    if (excludeCollectionIds.length > 0) {
      // Would need product→collection lookup; skip for now unless products have collection data
      // For now, skip if we can't resolve
    }
    if (excludeTags.length > 0) {
      // Would need product tags; skip for now
    }

    // Check INCLUDE rules
    // If include_* fields are set, the order MUST match at least one
    if (includeProductIds.length > 0) {
      if (!orderContainsAny(includeProductIds)) return false;
    }
    if (includeCollectionIds.length > 0) {
      // Would need product→collection lookup
    }
    if (includeTags.length > 0) {
      // Would need product tags
    }

    // Legacy trigger_product_ids check
    if (offer.trigger_product_ids) {
      try {
        const triggerIds = JSON.parse(offer.trigger_product_ids);
        if (Array.isArray(triggerIds) && triggerIds.length > 0) {
          const hasMatch = triggerIds.some(id => lineItemIds.includes(String(id)));
          if (!hasMatch) return false;
        }
      } catch {}
    }

    // First-time customer check
    if (offer.target_first_time_customer === 1) {
      const orderCount = customer?.orders_count || 0;
      if (orderCount > 1) return false; // Not first-time if they have prior orders
    }

    // Customer tags check
    if (offer.target_customer_tags) {
      const customerTags = parseJsonField(offer.target_customer_tags);
      if (customerTags.length > 0) {
        const custTags = (customer?.tags || '').split(',').map(t => t.trim());
        const hasTag = customerTags.some(tag => custTags.includes(tag));
        if (!hasTag) return false;
      }
    }

    return true;
  });

  if (!matchingOffer) return res.json({ offer: null, reason: 'no_matching_offer' });

  // Fetch upsell product details if add_product or warranty type
  let product = null;
  if (['add_product', 'warranty'].includes(matchingOffer.offer_type) && matchingOffer.upsell_product_id) {
    try {
      const productRes = await fetch(`https://${shop}/admin/api/2024-01/products/${matchingOffer.upsell_product_id}.json`, {
        headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' }
      });
      if (productRes.ok) product = (await productRes.json()).product;
    } catch (e) {
      console.error('[check] Product fetch error:', e.message);
    }
  }

  const discountCode = matchingOffer.upsell_discount_code || null;

  res.json({
    offer: {
      id: matchingOffer.id,
      order_id: order_id,
      offer_type: matchingOffer.offer_type,
      headline: matchingOffer.headline || 'Special offer just for you!',
      message: matchingOffer.message || 'Add something special to your order!',
      product: product ? {
        id: product.id,
        title: product.title,
        price: product.variants?.[0]?.price,
        image: product.images?.[0]?.src,
        variant_id: product.variants?.[0]?.id
      } : null,
      discount_code: discountCode,
      discount_value: matchingOffer.upsell_discount_value,
      upsell_price: product?.variants?.[0]?.price
    }
  });
});

// ── POST /api/upsell/accept ───────────────────────────────────────────────────
// Accept an upsell: add line item via Shopify Order Editing API
router.post('/accept', async (req, res) => {
  const { order_id, shop, offer_id, variant_id, quantity } = req.body;
  if (!order_id || !shop || !offer_id) {
    return res.status(400).json({ error: 'order_id, shop, and offer_id are required' });
  }

  await db.ensureReady();
  const store = await StoreModel.findByShop(shop);
  if (!store) return res.status(404).json({ error: 'Store not found' });
  if (!store.access_token) return res.status(401).json({ error: 'Store not connected' });

  const offer = db.usePostgres
    ? await db.prepare('SELECT * FROM upsell_offers WHERE id = $1 AND store_id = $2').get(offer_id, store.id)
    : db.prepare('SELECT * FROM upsell_offers WHERE id = ? AND store_id = ?').get(offer_id, store.id);

  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  // Fetch original order total BEFORE adding item
  const originalOrder = await fetchShopifyOrder(shop, store.access_token, order_id);
  const originalTotal = originalOrder ? parseFloat(originalOrder.total_price || 0) : 0;

  if (offer.offer_type === 'add_product' || offer.offer_type === 'warranty') {
    try {
      // Step 1: Create order edit draft
      const editRes = await fetch(`https://${shop}/admin/api/2024-01/orders/${order_id}/edits.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Post-purchase upsell accepted' })
      });
      if (!editRes.ok) {
        const err = await editRes.json().catch(() => ({}));
        return res.status(editRes.status).json({ error: 'Failed to create order edit', details: err });
      }
      const editData = await editRes.json();
      const editId = editData.order_edit?.id;
      if (!editId) return res.status(500).json({ error: 'No edit ID returned from Shopify' });

      // Step 2: Add line item
      const vid = variant_id || offer.upsell_product_id;
      const addRes = await fetch(`https://${shop}/admin/api/2024-01/orders/${order_id}/edits/${editId}/line_items.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_item: { variant_id: parseInt(vid), quantity: quantity || 1 } })
      });
      if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}));
        return res.status(addRes.status).json({ error: 'Failed to add line item', details: err });
      }

      // Step 3: Commit the edit
      const commitRes = await fetch(`https://${shop}/admin/api/2024-01/orders/${order_id}/edits/${editId}/commit.json`, {
        method: 'POST',
        headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' }
      });
      if (!commitRes.ok) {
        const err = await commitRes.json().catch(() => ({}));
        return res.status(commitRes.status).json({ error: 'Failed to commit order edit', details: err });
      }

      // Fetch updated order to calculate added revenue
      const updatedOrder = await fetchShopifyOrder(shop, store.access_token, order_id);
      const updatedTotal = updatedOrder ? parseFloat(updatedOrder.total_price || 0) : 0;
      const addedRevenue = Math.max(0, updatedTotal - originalTotal);

      await logResponse(store.id, order_id, offer_id, 'accepted', addedRevenue);

      res.json({
        success: true,
        order_updated: true,
        added_revenue: addedRevenue,
        message: offer.offer_type === 'warranty' ? 'Protection plan added to your order!' : 'Item added to your order!'
      });
    } catch (e) {
      console.error('[/upsell/accept]', e.message);
      res.status(500).json({ error: 'Failed to add item: ' + e.message });
    }
  } else if (offer.offer_type === 'discount') {
    await logResponse(store.id, order_id, offer_id, 'accepted', 0);
    res.json({
      success: true,
      order_updated: false,
      added_revenue: 0,
      message: 'Discount code applied!',
      discount_code: offer.upsell_discount_code,
      discount_value: offer.upsell_discount_value
    });
  } else {
    res.status(400).json({ error: 'Unknown offer type' });
  }
});

// ── POST /api/upsell/decline ──────────────────────────────────────────────────
router.post('/decline', async (req, res) => {
  const { order_id, shop, offer_id } = req.body;
  if (!order_id || !shop) return res.status(400).json({ error: 'order_id and shop are required' });

  await db.ensureReady();
  const store = await StoreModel.findByShop(shop);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  await logResponse(store.id, order_id, offer_id || null, 'declined', 0);

  // Check if this offer has a fallback offer
  let fallbackOffer = null;
  if (offer_id) {
    const offer = db.usePostgres
      ? await db.prepare('SELECT * FROM upsell_offers WHERE id = $1').get(offer_id)
      : db.prepare('SELECT * FROM upsell_offers WHERE id = ?').get(offer_id);

    if (offer?.fallback_for_offer_id) {
      if (db.usePostgres) {
        fallbackOffer = await db.prepare('SELECT * FROM upsell_offers WHERE id = $1 AND active = 1').get(offer.fallback_for_offer_id);
      } else {
        fallbackOffer = db.prepare('SELECT * FROM upsell_offers WHERE id = ? AND active = 1').get(offer.fallback_for_offer_id);
      }
    }
  }

  // If no explicit fallback link, look for a fallback offer targeting the same store
  // that has fallback_for_offer_id pointing to a parent offer
  if (!fallbackOffer && offer_id) {
    if (db.usePostgres) {
      const fb = await db.prepare(`
        SELECT * FROM upsell_offers WHERE store_id = $1 AND active = 1 AND fallback_for_offer_id IS NOT NULL
        LIMIT 1
      `).get(store.id);
      fallbackOffer = fb || null;
    } else {
      const fb = db.prepare(`
        SELECT * FROM upsell_offers WHERE store_id = ? AND active = 1 AND fallback_for_offer_id IS NOT NULL
        LIMIT 1
      `).get(store.id);
      fallbackOffer = fb || null;
    }
  }

  if (fallbackOffer) {
    // Fetch product for fallback if needed
    let product = null;
    if (['add_product', 'warranty'].includes(fallbackOffer.offer_type) && fallbackOffer.upsell_product_id) {
      try {
        const productRes = await fetch(`https://${shop}/admin/api/2024-01/products/${fallbackOffer.upsell_product_id}.json`, {
          headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' }
        });
        if (productRes.ok) product = (await productRes.json()).product;
      } catch (e) {
        console.error('[decline] fallback product fetch error:', e.message);
      }
    }

    res.json({
      success: true,
      declined: true,
      fallback_available: true,
      fallback_offer: {
        id: fallbackOffer.id,
        offer_type: fallbackOffer.offer_type,
        headline: fallbackOffer.headline || 'Something else just for you!',
        message: fallbackOffer.message || 'How about this instead?',
        product: product ? {
          id: product.id,
          title: product.title,
          price: product.variants?.[0]?.price,
          image: product.images?.[0]?.src,
          variant_id: product.variants?.[0]?.id
        } : null,
        discount_code: fallbackOffer.upsell_discount_code || null,
        discount_value: fallbackOffer.upsell_discount_value
      }
    });
  } else {
    res.json({
      success: true,
      declined: true,
      fallback_available: false,
      fallback_offer: null
    });
  }
});

// ── GET /api/upsell/stats ─────────────────────────────────────────────────────
// Conversion stats for the merchant dashboard
router.get('/stats', verifyShop, async (req, res) => {
  try {
    const totals = db.usePostgres
      ? await db.prepare(`
          SELECT response, COUNT(*) as count
          FROM upsell_responses
          WHERE store_id = $1 AND response IN ('accepted', 'declined')
          GROUP BY response
        `).all(req.store.id)
      : db.prepare(`
          SELECT response, COUNT(*) as count
          FROM upsell_responses
          WHERE store_id = ? AND response IN ('accepted', 'declined')
          GROUP BY response
        `).all(req.store.id);

    const totalMap = {};
    for (const t of (totals || [])) totalMap[t.response] = parseInt(t.count);

    const accepts = totalMap['accepted'] || 0;
    const declines = totalMap['declined'] || 0;
    const total = accepts + declines;
    const acceptanceRate = total > 0 ? Math.round((accepts / total) * 10000) / 100 : 0;

    res.json({
      accepts,
      declines,
      total_responses: total,
      acceptance_rate: acceptanceRate,
      store_id: req.store.id
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;