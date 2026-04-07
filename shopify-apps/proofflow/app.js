/**
 * ProofFlow - Main Express Application
 * Social Proof & Product Review App for Shopify
 * 
 * Handles OAuth authentication, webhooks, API routes, and session management
 */

import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './app/routes/auth.routes.js';
import reviewsRoutes from './app/routes/reviews.routes.js';
import productsRoutes from './app/routes/products.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import notificationsRoutes from './app/routes/notifications.routes.js';
import billingRoutes from './app/routes/billing.routes.js';
import settingsRoutes from './app/routes/settings.routes.js';

import { initDatabase } from './app/models/db.js';
import { deleteStore } from './app/models/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'proofflow_session'
}));

function verifyShopifyWebhook(req) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_API_SECRET;
  
  if (!hmacHeader || !secret) {
    return false;
  }
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body), 'utf8')
    .digest('base64');
    
  return hmacHeader === hash;
}

app.use(express.static(join(__dirname, 'public')));
app.use(express.static(join(__dirname, 'app/frontend')));

app.use('/api/auth', authRoutes);

app.post('/webhooks/orders/create', async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      console.error('[Webhook] Invalid HMAC signature for orders/create');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const order = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`[Webhook] Received orders/create for ${shopDomain}, order ID: ${order.id}`);
    
    const { createNotification } = await import('./app/models/notification.js');
    const { getStore } = await import('./app/models/store.js');
    const store = getStore(shopDomain);
    
    if (store && order.line_items) {
      for (const item of order.line_items) {
        createNotification({
          store_id: store.id,
          type: 'purchase',
          product_id: item.product_id ? item.product_id.toString() : null,
          location: order.customer?.default_address?.city || '',
          city: order.customer?.default_address?.city || '',
          session_id: ''
        });
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook] orders/create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhooks/app/uninstalled', async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      console.error('[Webhook] Invalid HMAC signature for app/uninstalled');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`[Webhook] App uninstalled from ${shopDomain}`);
    
    await deleteStore(shopDomain);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook] app/uninstalled error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/reviews', reviewsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer() {
  try {
    console.log('[App] Initializing database...');
    initDatabase();
    console.log('[App] Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`[App] ProofFlow server running on port ${PORT}`);
      console.log(`[App] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[App] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
