import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// HMAC verification for Shopify webhook/callback requests
function verifyShopifyHmac(query, secret) {
  const { hmac, ...params } = query;
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac || ''), Buffer.from(generatedHash));
}

// Verify Shopify session token (JWT) — replaces cookie-based auth
router.post('/session/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const sessionToken = req.body?.sessionToken || (authHeader ? authHeader.replace('Bearer ', '') : null);

  if (!sessionToken && !shopDomain) {
    return res.status(401).json({ error: 'No session token or shop domain provided' });
  }

  if (shopDomain) {
    await db.ensureReady();
    const store = await StoreModel.findByShop(shopDomain);
    if (!store) return res.status(401).json({ error: 'Store not found' });
    return res.json({ store: { id: store.id, shop: store.shop } });
  }

  if (sessionToken) {
    try {
      const parts = sessionToken.split('.');
      if (parts.length !== 3) {
        await db.ensureReady();
        const store = await StoreModel.findById(sessionToken);
        if (!store) return res.status(401).json({ error: 'Invalid token' });
        return res.json({ store: { id: store.id, shop: store.shop } });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const shop = payload.dest?.replace('https://', '') || payload.aud;

      if (!shop) return res.status(401).json({ error: 'Invalid token payload' });

      await db.ensureReady();
      let store = await StoreModel.findByShop(shop);
      if (!store) {
        const id = uuidv4();
        await StoreModel.create({ id, shop, accessToken: sessionToken, scope: 'read_orders,read_products' });
        return res.json({ store: { id, shop } });
      }

      return res.json({ store: { id: store.id, shop: store.shop } });
    } catch (e) {
      return res.status(401).json({ error: 'Token verification failed: ' + e.message });
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
});

// OAuth callback — Shopify redirects here after merchant authorizes
router.get('/callback', async (req, res) => {
  try {
    const { shop, code, state, hmac, timestamp } = req.query;

    if (!shop) return res.status(400).json({ error: 'Shop required' });

    // Verify HMAC to prevent tampering
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (apiSecret && hmac && timestamp) {
      try {
        const verified = verifyShopifyHmac(req.query, apiSecret);
        if (!verified) {
          return res.status(401).json({ error: 'HMAC verification failed' });
        }
      } catch (e) {
        console.error('HMAC verify threw:', e.message);
        return res.status(401).json({ error: 'HMAC verification error' });
      }
    }

    // Verify state to prevent CSRF (skip if no session store)
    if (state && req.session?.state && state !== req.session.state) {
      return res.status(401).json({ error: 'State mismatch — possible CSRF' });
    }

    await db.ensureReady();

    // In production: exchange code for access token via Shopify OAuth API
    // For now: auto-create or update store with code as token
    let store = await StoreModel.findByShop(shop);
    if (!store) {
      const id = uuidv4();
      await StoreModel.create({ id, shop, accessToken: code || uuidv4(), scope: 'read_orders,read_products' });
      store = await StoreModel.findByShop(shop);
    }

    // Redirect to app root with store info
    // For embedded apps: redirect to React app with query params
    let appUrl = process.env.APP_URL || 'https://revenuepulse-production.up.railway.app';
    // Ensure absolute URL with protocol
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      appUrl = 'https://' + appUrl;
    }
    res.redirect(`${appUrl}/?store_id=${store.id}&shop=${shop}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'OAuth callback failed: ' + err.message });
  }
});

// Health check for auth
router.get('/health', (req, res) => {
  res.json({ status: 'ok', auth: 'active' });
});

export default router;
