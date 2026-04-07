import express from 'express';
import StoreModel from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// Middleware: verify shop from header
async function verifyShop(req, res, next) {
  const shop = req.headers['x-shopify-shop-domain'];
  if (!shop) return res.status(401).json({ error: 'Missing X-Shopify-Shop-Domain header' });
  const store = await StoreModel.findByShop(shop);
  if (!store) return res.status(404).json({ error: 'Store not found' });
  req.store = store;
  next();
}

// ── GET /api/shopify/products ────────────────────────────────────────────────
// Search products from the merchant's Shopify store (for targeting selectors)
router.get('/products', verifyShop, async (req, res) => {
  const { query = '', limit = 50 } = req.query;
  try {
    const shop = req.store.shop;
    const accessToken = req.store.access_token;
    if (!accessToken) return res.status(401).json({ error: 'Not connected to Shopify' });

    const apiUrl = `https://${shop}/admin/api/2024-01/products.json?title=${encodeURIComponent(query)}&limit=${Math.min(parseInt(limit), 50)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Shopify API error: ' + err });
    }

    const data = await response.json();
    const products = (data.products || []).map(p => ({
      id: p.id,
      title: p.title,
      vendor: p.vendor,
      product_type: p.product_type,
      tags: p.tags,
      image: p.images?.[0]?.src || null,
      variants: p.variants?.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price,
        sku: v.sku
      })) || []
    }));

    res.json({ products });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/shopify/collections ─────────────────────────────────────────────
// Get all custom collections from the merchant's Shopify store
router.get('/collections', verifyShop, async (req, res) => {
  try {
    const shop = req.store.shop;
    const accessToken = req.store.access_token;
    if (!accessToken) return res.status(401).json({ error: 'Not connected to Shopify' });

    const response = await fetch(`https://${shop}/admin/api/2024-01/custom_collections.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Shopify API error: ' + err });
    }

    const data = await response.json();
    const collections = (data.custom_collections || []).map(c => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      description: c.body_html,
      image: c.image?.src || null
    }));

    res.json({ collections });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/shopify/product-tags ───────────────────────────────────────────
// Get all unique product tags from the merchant's Shopify store
router.get('/product-tags', verifyShop, async (req, res) => {
  try {
    const shop = req.store.shop;
    const accessToken = req.store.access_token;
    if (!accessToken) return res.status(401).json({ error: 'Not connected to Shopify' });

    // Fetch products with only tags field to get unique tags
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?fields=tags&limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Shopify API error: ' + err });
    }

    const data = await response.json();
    const tagSet = new Set();
    for (const p of (data.products || [])) {
      if (p.tags) {
        p.tags.split(',').forEach(t => tagSet.add(t.trim()));
      }
    }

    const tags = Array.from(tagSet).sort();
    res.json({ tags });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
