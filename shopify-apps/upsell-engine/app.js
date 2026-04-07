/**
 * RevenuePulse - Main Express Application
 * Post-Purchase Upsell Engine for Shopify
 * 
 * Handles OAuth authentication, webhooks, API routes, and session management
 */

import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './app/routes/auth.routes.js';
import upsellRoutes from './app/routes/upsell.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import billingRoutes from './app/routes/billing.routes.js';
import productsRoutes from './app/routes/products.routes.js';
import upsellEvaluateRoutes from './app/routes/upsell-evaluate.routes.js';
import targetingRoutes from './app/routes/targeting.routes.js';

// Import services
import { initDatabase } from './app/models/store.js';
import { handleWebhook } from './app/services/webhook.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// Session management with encrypted cookies
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'revenuepulse_session'
}));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify Shopify webhook HMAC signature
 */
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

/**
 * Get store domain from request
 */
function getStoreDomain(req) {
  return req.query.shop || req.headers['x-shopify-shop-domain'] || req.session?.storeDomain;
}

/**
 * Auth middleware - ensure store is authenticated
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.storeDomain) {
    return res.status(401).json({ error: 'Unauthorized - Please install the app first' });
  }
  next();
}

// ============================================
// STATIC FILES
// ============================================

app.use(express.static(join(__dirname, 'public')));
app.use(express.static(join(__dirname, 'app/frontend')));

// ============================================
// AUTH ROUTES (OAuth Flow)
// ============================================

app.use('/api/auth', authRoutes);

// ============================================
// WEBHOOK HANDLERS
// ============================================

/**
 * Shopify orders/create webhook
 * Triggered when a new order is created
 * Evaluates and displays upsell offers
 */
app.post('/webhooks/orders/create', async (req, res) => {
  try {
    // Verify webhook authenticity
    if (!verifyShopifyWebhook(req)) {
      console.error('[Webhook] Invalid HMAC signature for orders/create');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const order = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`[Webhook] Received orders/create for ${shopDomain}, order ID: ${order.id}`);
    
    // Process the order for upsell evaluation
    const result = await handleWebhook('orders/create', order, shopDomain);
    
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('[Webhook] orders/create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Shopify orders/updated webhook
 * Triggered when an order is modified (including upsell acceptance)
 */
app.post('/webhooks/orders/updated', async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      console.error('[Webhook] Invalid HMAC signature for orders/updated');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const order = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`[Webhook] Received orders/updated for ${shopDomain}, order ID: ${order.id}`);
    
    const result = await handleWebhook('orders/updated', order, shopDomain);
    
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('[Webhook] orders/updated error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Shopify app/uninstalled webhook
 * Cleanup store data when app is uninstalled
 */
app.post('/webhooks/app/uninstalled', async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      console.error('[Webhook] Invalid HMAC signature for app/uninstalled');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    
    console.log(`[Webhook] App uninstalled from ${shopDomain}`);
    
    // Import and run cleanup
    const { deleteStore } = await import('./app/models/store.js');
    await deleteStore(shopDomain);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook] app/uninstalled error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// API ROUTES (Protected by auth middleware)
// ============================================

app.use('/api/offers', requireAuth, upsellRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/billing', requireAuth, billingRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/upsell', upsellEvaluateRoutes);
app.use('/api/targeting', requireAuth, targetingRoutes);

// ============================================
// ANALYTICS TRACKING ENDPOINT (Public for extension)
// ============================================

app.post('/api/analytics/track', async (req, res) => {
  try {
    const { offerId, orderId, customerId, eventType, revenue, shopDomain } = req.body;
    
    if (!eventType || !shopDomain) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { trackEvent } = await import('./app/services/analytics.service.js');
    await trackEvent({ offerId, orderId, customerId, eventType, revenue, shopDomain });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Initialize database
    console.log('[App] Initializing database...');
    initDatabase();
    console.log('[App] Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`[App] RevenuePulse server running on port ${PORT}`);
      console.log(`[App] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[App] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
