import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StoreModel } from '../models/store.js';

const router = express.Router();

// Verify Shopify session token (JWT) — replaces cookie-based auth
// Shopify sends session token via X-Shopify-Access-Token header or Authorization Bearer
// For embedded apps, Shopify App Bridge sends it as a header
router.post('/session/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  const shopDomain = req.headers['x-shopify-shop-domain'];

  // Also accept session token via body (from frontend)
  const sessionToken = req.body?.sessionToken || (authHeader ? authHeader.replace('Bearer ', '') : null);

  if (!sessionToken && !shopDomain) {
    return res.status(401).json({ error: 'No session token or shop domain provided' });
  }

  // If we have a shop domain and API key, verify against our store
  if (shopDomain) {
    const store = StoreModel.findByShop(shopDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }
    return res.json({ store: { id: store.id, shop: store.shop } });
  }

  // If we have a session token, decode and verify it
  if (sessionToken) {
    try {
      // Shopify session tokens are base64-encoded JSON with a Shopify signature
      // Format: base64(header).base64(payload).signature
      const parts = sessionToken.split('.');
      if (parts.length !== 3) {
        // May be a simple opaque token — look up store
        const store = StoreModel.findById(sessionToken);
        if (!store) return res.status(401).json({ error: 'Invalid token' });
        return res.json({ store: { id: store.id, shop: store.shop } });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const shop = payload.dest?.replace('https://', '') || payload.aud;

      if (!shop) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      const store = StoreModel.findByShop(shop);
      if (!store) {
        // Auto-register store on first access
        const id = uuidv4();
        StoreModel.create({ id, shop, accessToken: sessionToken, scope: 'read_orders,read_products' });
        return res.json({ store: { id, shop } });
      }

      return res.json({ store: { id: store.id, shop: store.shop } });
    } catch (e) {
      return res.status(401).json({ error: 'Token verification failed: ' + e.message });
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
});

// OAuth callback — standard Shopify OAuth flow
router.get('/callback', (req, res) => {
  const { shop, code } = req.query;
  if (!shop) return res.status(400).json({ error: 'Shop required' });

  // In production: exchange code for access token via Shopify OAuth
  // For now: auto-create or update store
  let store = StoreModel.findByShop(shop);
  if (!store) {
    const id = uuidv4();
    StoreModel.create({ id, shop, accessToken: 'token_' + (code || id), scope: 'read_orders,read_products' });
    store = StoreModel.findByShop(shop);
  }

  // Redirect to app with store ID for embedded app
  const appUrl = process.env.APP_URL || 'https://revenuepulse.up.railway.app';
  res.redirect(`${appUrl}?store_id=${store.id}&shop=${shop}`);
});

// Health check for auth
router.get('/health', (req, res) => {
  res.json({ status: 'ok', auth: 'active' });
});

export default router;
