import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StoreModel } from '../models/store.js';

const router = express.Router();

// Mock Shopify OAuth - in production use shopify-api-node
router.get('/mock-login', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).json({ error: 'Shop required' });
  
  // Simulate store creation for demo
  let store = StoreModel.findByShop(shop);
  if (!store) {
    const id = uuidv4();
    StoreModel.create({ id, shop, accessToken: 'mock_token_' + id, scope: 'read_products,write_products' });
    store = StoreModel.findByShop(shop);
  }
  
  res.json({ success: true, store: { id: store.id, shop: store.shop } });
});

router.get('/auth/callback', (req, res) => {
  const { shop, code } = req.query;
  if (!shop) return res.status(400).json({ error: 'Shop required' });
  
  // In production, exchange code for access token via Shopify OAuth
  let store = StoreModel.findByShop(shop);
  if (!store) {
    const id = uuidv4();
    StoreModel.create({ id, shop, accessToken: 'token_' + code, scope: 'read_products,write_products' });
    store = StoreModel.findByShop(shop);
  }
  
  res.send(`<script>window.opener && window.opener.postMessage('auth-success:${store.id}', '*');window.close();</script>`);
});

router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth' });
  
  const token = authHeader.replace('Bearer ', '');
  const store = StoreModel.findById(token);
  if (!store) return res.status(401).json({ error: 'Invalid token' });
  
  res.json({ store: { id: store.id, shop: store.shop } });
});

export default router;