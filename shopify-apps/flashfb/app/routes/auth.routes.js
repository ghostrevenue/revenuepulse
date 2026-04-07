import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getStore, createStore } from '../store.js';

const router = express.Router();

// Shopify OAuth handshake
router.get('/shopify', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  const state = uuidv4();
  const redirectUri = `${process.env.HOST}/api/auth/shopify/callback`;
  const scopes = process.env.SCOPES || 'read_orders,write_orders,read_customers';

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  
  res.json({ authUrl, state });
});

router.post('/shopify/callback', async (req, res) => {
  const { shop, code, state } = req.body;
  
  try {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to exchange code for token' });
    }

    const data = await response.json();
    const storeId = uuidv4();
    
    const store = createStore({
      id: storeId,
      shop,
      access_token: data.access_token,
      scope: data.scope
    });

    res.json({ success: true, store });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

router.get('/verify', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  const store = getStore(shop);
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  res.json({ authenticated: true, store: { id: store.id, shop: store.shop } });
});

export default router;
