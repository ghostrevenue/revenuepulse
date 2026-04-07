import express from 'express';
import crypto from 'crypto';
import { Store } from '../store.js';

const router = express.Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,write_products';
const SHOPIFY_HOST = process.env.SHOPIFY_HOST || 'https://localhost:3007';

router.get('/', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  const redirectUri = `${SHOPIFY_HOST}/auth/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${redirectUri}&state=${state}`;
  
  res.cookie('oauth_state', state);
  res.redirect(installUrl);
});

router.get('/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  const { oauth_state } = req.cookies;

  if (!oauth_state || state !== oauth_state) {
    return res.status(400).json({ error: 'Invalid OAuth state' });
  }

  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    const storeId = crypto.createHash('sha256').update(shop).digest('hex');
    Store.create(storeId, shop, accessToken, scope);

    res.cookie('store_id', storeId);
    res.redirect(`/admin?shop=${shop}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

router.get('/verify', (req, res) => {
  const { shop } = req.query;
  const store = Store.findByDomain(shop);
  res.json({ valid: !!store, store });
});

export default router;
