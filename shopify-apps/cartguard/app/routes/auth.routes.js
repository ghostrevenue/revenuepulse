import { Router } from 'express';
import { createStore, getStoreByShop, updateStore } from '../models/store.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3002';

// OAuth start
router.get('/', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  const redirectUri = `${APP_URL}/api/auth/callback`;
  const scopes = 'read_orders,write_orders,read_products,write_products,read_customers';
  
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${uuidv4()}`;
  
  res.json({ authUrl, shop });
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  
  if (!shop || !code) {
    return res.status(400).json({ error: 'Missing shop or code' });
  }

  try {
    // In production, verify state and exchange code for access token
    // For demo, we'll create a store record
    let store = getStoreByShop(shop);
    
    if (!store) {
      store = createStore({
        shop,
        access_token: 'demo_token_' + Date.now(),
        scope: 'read_orders,write_orders,read_products,write_products',
        billing_plan: 'starter'
      });
    } else {
      store = updateStore(store.id, { access_token: 'demo_token_' + Date.now() });
    }

    // Redirect to app dashboard
    res.redirect(`${APP_URL}?shop=${shop}&token=${store.id}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ error: 'Authentication failed', message: err.message });
  }
});

// Get store info
router.get('/store', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }
  
  const store = getStoreByShop(shop);
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }
  
  res.json({ 
    id: store.id, 
    shop: store.shop, 
    billing_plan: store.billing_plan,
    installed: true 
  });
});

// Uninstall webhook
router.post('/uninstall', (req, res) => {
  const { shop } = req.body;
  console.log(`[Auth] Store uninstalled: ${shop}`);
  res.json({ ok: true });
});

export default router;
