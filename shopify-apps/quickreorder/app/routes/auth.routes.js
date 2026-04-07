import express from 'express';
import crypto from 'crypto';
import Store from '../models/store.js';

const router = express.Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL = process.env.APP_URL || `http://localhost:3003`;
const SCOPES = process.env.SCOPES || 'read_orders,write_orders,read_products,write_products,read_customers,write_customers';

// OAuth initiate
router.get('/shopify', (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }
  
  const redirectUri = `${APP_URL}/api/auth/shopify/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${redirectUri}&state=${state}`;
  
  res.json({ authUrl, state });
});

// OAuth callback
router.post('/shopify/callback', async (req, res) => {
  const { shop, code, state } = req.body;
  
  if (!shop || !code) {
    return res.status(400).json({ error: 'Missing shop or code' });
  }
  
  try {
    // In production, exchange code for access token via Shopify
    // For demo, we'll create a mock token
    const accessToken = `mock_token_${shop}_${Date.now()}`;
    
    // Upsert store
    const existingStore = Store.findByShop(shop);
    if (existingStore) {
      Store.updateAccessToken(shop, accessToken);
    } else {
      Store.create(shop, accessToken, SCOPES);
    }
    
    res.json({ success: true, shop });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify webhook
router.post('/webhook/verify', express.text({ type: 'application/json' }), (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const secret = SHOPIFY_API_SECRET;
  
  if (!hmac) {
    return res.status(401).json({ error: 'Missing HMAC' });
  }
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(req.body, 'utf8')
    .digest('base64');
    
  if (hash !== hmac) {
    return res.status(401).json({ error: 'Invalid HMAC' });
  }
  
  res.json({ verified: true });
});

// Store info
router.get('/store/:shop', (req, res) => {
  const store = Store.findByShop(req.params.shop);
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }
  res.json({ store });
});

export default router;
