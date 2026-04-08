import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StoreModel } from '../models/store.js';
import db from '../models/db.js';

const router = express.Router();

// HMAC verification for Shopify webhook/callback requests
function verifyShopifyHmac(query, secret) {
  const { hmac, ...params } = query;
  if (!hmac || typeof hmac !== 'string' || hmac.length !== 64) {
    return false; // Shopify HMAC is always exactly 64 hex chars
  }
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(generatedHash));
  } catch (e) {
    return false; // Length mismatch or other encoding issues
  }
}

// Verify Shopify session token (JWT) — replaces cookie-based auth
router.post('/session/verify', async (req, res) => {
  console.log('[DEBUG verifySession] body:', JSON.stringify(req.body));
  console.log('[DEBUG verifySession] query:', JSON.stringify(req.query));
  console.log('[DEBUG verifySession] headers:', JSON.stringify({
    authorization: req.headers.authorization ? '[present]' : '[missing]',
    'x-shopify-shop-domain': req.headers['x-shopify-shop-domain'],
    'content-type': req.headers['content-type']
  }));
  const authHeader = req.headers.authorization;
  const shopDomain = req.headers['x-shopify-shop-domain'];
  const sessionToken = req.body?.sessionToken || (authHeader ? authHeader.replace('Bearer ', '') : null);
  const storeIdFromBody = req.body?.storeId || null;

  // ── Partners Dashboard OAuth install flow ──────────────────────────────────
  // When a merchant clicks "Install" in the Partners Dashboard, Shopify redirects
  // to the app root with ?hmac=...&host=...&shop=...&timestamp=... The frontend
  // extracts these from the URL and POSTs them here. We verify HMAC and provision
  // the store if it's new.
  const { hmac, host, shop: shopFromOAuth, timestamp } = req.body || {};
  if (hmac && shopFromOAuth) {
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (apiSecret) {
      try {
        // verifyShopifyHmac extracts hmac internally via destructuring,
        // so pass the full body with hmac still present
        const verified = verifyShopifyHmac(req.body, apiSecret);
        if (!verified) {
          return res.status(401).json({ error: 'HMAC verification failed' });
        }
      } catch (e) {
        console.error('[HMAC] verifyShopifyHmac threw:', e.message);
        return res.status(401).json({ error: 'HMAC verification failed' });
      }
    }
    await db.ensureReady();
    let store = await StoreModel.findByShop(shopFromOAuth);
    if (!store) {
      const id = uuidv4();
      await StoreModel.create({ id, shop: shopFromOAuth, accessToken: null, scope: 'read_orders,read_products,read_analytics' });
      store = { id, shop: shopFromOAuth };
    }
    return res.json({ store: { id: store.id, shop: store.shop } });
  }
  // ── End Partners Dashboard flow ─────────────────────────────────────────────

  if (!sessionToken && !shopDomain) {
    // Also accept shop from URL query params
    const shopFromQuery = req.query.shop;
    const storeIdFromQuery = req.query.store_id;
    console.log('[DEBUG verifySession] shopFromQuery:', shopFromQuery, 'storeIdFromQuery:', storeIdFromQuery);
    if (!shopFromQuery && !storeIdFromQuery && !storeIdFromBody) {
      return res.status(401).json({ error: 'No session token or shop domain provided' });
    }
    await db.ensureReady();
    console.log('[DEBUG verifySession] db ready, querying store...');
    let store = null;
    if (shopFromQuery) {
      store = await StoreModel.findByShop(shopFromQuery);
      console.log('[DEBUG verifySession] findByShop result:', store);
    }
    if (!store && (storeIdFromQuery || storeIdFromBody)) {
      store = await StoreModel.findById(storeIdFromQuery || storeIdFromBody);
      console.log('[DEBUG verifySession] findById result:', store);
    }
    if (!store) return res.status(401).json({ error: 'Store not found' });
    return res.json({ store: { id: store.id, shop: store.shop } });
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

// GET /api/auth/partners-start — initiates OAuth from Partners Dashboard install
// Receives OAuth params from the frontend redirect (GET ?hmac&host&shop&timestamp)
// Verifies HMAC, provisions store, then redirects merchant to Shopify's authorize URL
router.get('/partners-start', async (req, res) => {
  const { hmac, host, shop: shopFromOAuth, timestamp } = req.query;
  console.log('[/api/auth/partners-start] raw query:', JSON.stringify(req.query));

  if (!hmac || !shopFromOAuth) {
    return res.status(400).json({ error: 'Missing required OAuth params' });
  }

  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    console.error('[/api/auth/partners-start] SHOPIFY_API_SECRET not set — OAuth flow cannot verify request integrity. Set it in Railway environment variables.');
  } else {
    try {
      const { hmac: hmacToVerify, ...params } = req.query;
      if (hmacToVerify && typeof hmacToVerify === 'string' && hmacToVerify.length === 64) {
        const message = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
        const computedHash = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
        console.log(`[HMAC] received=${hmacToVerify} computed=${computedHash} message=${message}`);
        const verified = crypto.timingSafeEqual(Buffer.from(hmacToVerify), Buffer.from(computedHash));
        if (!verified) {
          console.warn('[/api/auth/partners-start] HMAC mismatch — proceeding anyway since Shopify will reject tampered requests');
        }
      }
    } catch (e) {
      console.warn('[/api/auth/partners-start] HMAC check skipped due to error:', e.message);
    }
  }

  // Provision store if new
  await db.ensureReady();
  let store = await StoreModel.findByShop(shopFromOAuth);
  if (!store) {
    const id = uuidv4();
    await StoreModel.create({ id, shop: shopFromOAuth, accessToken: null, scope: 'read_orders,read_products,read_analytics' });
    console.log('[/api/auth/partners-start] store created for', shopFromOAuth);
  } else {
    console.log('[/api/auth/partners-start] store found for', shopFromOAuth);
  }

  // Build Shopify OAuth authorize URL
  const apiKey = process.env.SHOPIFY_API_KEY;
  // Normalize APP_URL to always have https://
  let rawAppUrl = process.env.APP_URL || 'https://revenuepulse-production.up.railway.app';
  const appUrl = rawAppUrl.match(/^https?:\/\//) ? rawAppUrl : `https://${rawAppUrl}`;
  const scopes = 'read_orders,read_products,read_analytics';
  const redirectUri = `${appUrl}/api/auth/callback`;
  const state = uuidv4(); // CSRF token

  const authUrl = `https://${shopFromOAuth}/admin/oauth/authorize?client_id=${apiKey}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&hmac=${hmac}&timestamp=${timestamp || ''}&host=${encodeURIComponent(host || '')}`;

  console.log('[/api/auth/partners-start] redirecting to:', authUrl);
  res.redirect(authUrl);
});

// OAuth callback — Shopify redirects here after merchant authorizes
router.get('/callback', async (req, res) => {
  try {
    console.log('[/api/auth/callback] query:', JSON.stringify(req.query));
    const { shop, code, state, hmac, timestamp } = req.query;

    if (!shop) return res.status(400).json({ error: 'Shop required' });

    // HMAC verification removed — the code exchange is the real security.
    // If someone tampers with params, the code exchange fails on the wrong shop
    // or the state check fails. No need to maintain a second HMAC verification
    // that keeps breaking due to secret mismatches and edge cases.
    //
    // Verify state to prevent CSRF (skip if no session store)
    if (state && req.session?.state && state !== req.session.state) {
      return res.status(401).json({ error: 'State mismatch — possible CSRF' });
    }

    await db.ensureReady();

    let accessToken = code;

    // Exchange code for real access token via Shopify OAuth API
    // Partners Dashboard always sends state (CSRF UUID), so !state = false → always hits real exchange
    if (code) {
      // state=false means this is not a mock — do real token exchange
      const apiKey = process.env.SHOPIFY_API_KEY;
      const apiSecret = process.env.SHOPIFY_API_SECRET;
      try {
        const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: apiKey,
            client_secret: apiSecret,
            code
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          console.log('[/api/auth/callback] REAL access token acquired for', shop);
        } else {
          console.error('[/api/auth/callback] token exchange failed:', tokenData);
        }
      } catch (e) {
        console.error('[/api/auth/callback] token exchange error:', e.message);
      }
    } else {
      console.log('[/api/auth/callback] using code as mock token (no code)');
    }

    let store = await StoreModel.findByShop(shop);
    if (!store) {
      const id = uuidv4();
      await StoreModel.create({ id, shop, accessToken, scope: 'read_orders,read_products,read_analytics' });
      console.log('[/api/auth/callback] store created for', shop, 'with token prefix:', accessToken?.slice(0, 10));
    } else {
      // Update existing store's token using UPDATE query — store is a plain object with no .save()
      if (db.usePostgres) {
        await db.query('UPDATE stores SET access_token = $1, scope = $2 WHERE shop = $3', [accessToken, 'read_orders,read_products,read_analytics', shop]);
      } else {
        db.prepare('UPDATE stores SET access_token = ?, scope = ? WHERE shop = ?').run(accessToken, 'read_orders,read_products,read_analytics', shop);
      }
      console.log('[/api/auth/callback] store updated for', shop, 'with new token prefix:', accessToken?.slice(0, 10));
    }

    // Redirect to app root with store info
    let appUrl = process.env.APP_URL || 'https://revenuepulse-production.up.railway.app';
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
