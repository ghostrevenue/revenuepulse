import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Raw body for webhook signature verification (must be before json parser)
app.use('/webhooks', express.raw({ type: 'application/json' }));

// ─── Static Frontend ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'app/frontend')));

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes from './app/routes/auth.routes.js';
import revenueRoutes from './app/routes/revenue.routes.js';
import billingRoutes from './app/routes/billing.routes.js';
import webhooksRoutes from './app/routes/webhooks.routes.js';
import upsellRoutes from './app/routes/upsell.routes.js';
import dashboardRoutes from './app/routes/dashboard.routes.js';
import shopifyRoutes from './app/routes/shopify.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/upsell', upsellRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/webhooks', webhooksRoutes);

// ─── Shopify OAuth: Entry point when merchant clicks "Install" ────────────────
// Shopify redirects here with client_id, scope, redirect_uri, state, hmac, timestamp, shop
// We verify the request and redirect to Shopify's real authorize URL
app.get('/admin/oauth/authorize', (req, res) => {
  console.log('[/admin/oauth/authorize] query:', JSON.stringify(req.query));
  const { shop, client_id, scope, redirect_uri, state, hmac, timestamp } = req.query;

  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  // In production: verify HMAC before redirecting
  // For now, redirect to Shopify's authorize endpoint
  const authorizeUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;

  res.redirect(authorizeUrl);
});

// ─── Embedded App: Shopify App Bridge config endpoint ──────────────────────────
// Shopify App Bridge requires an initialization config passed to the frontend
app.get('/api/app-bridge-config', (req, res) => {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const shop = req.query.shop;
  const appUrl = (() => {
    let url = process.env.APP_URL || 'https://revenuepulse-production.up.railway.app';
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    return url;
  })();

  if (!apiKey) {
    return res.status(500).json({ error: 'SHOPIFY_API_KEY not configured' });
  }

  // App Bridge configuration for embedded apps
  const config = {
    apiKey: apiKey,
    shopOrigin: shop || null,
    forceRedirect: true,
    appUrl: appUrl
  };

  res.json(config);
});

// ─── Root — MUST handle OAuth redirect params when present ────────────────────
// When embedded=false, Shopify calls the app root with OAuth params
// (hmac, host, shop, timestamp) as a fallback after authorization.
// If a 'code' is present, redirect to callback to complete token exchange.
app.get('/', (req, res) => {
  console.log('[ROOT /] query:', JSON.stringify(req.query));
  const { code, hmac, host, shop, timestamp } = req.query;

  // If code param is present, redirect to callback to complete OAuth
  if (code) {
    console.log('[ROOT /] OAuth code detected — redirecting to /api/auth/callback');
    return res.redirect(`/api/auth/callback?${new URLSearchParams(req.query).toString()}`);
  }

  // OAuth params present but no code — log for diagnosis then serve app
  if (hmac || host || shop) {
    console.log('[ROOT /] OAuth params present but NO code — shop:', shop, 'host:', host);
  }

  res.sendFile(path.join(__dirname, 'app/frontend', 'index.html'));
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'RevenuePulse',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    postgres: !!process.env.DATABASE_URL
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`RevenuePulse app running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Railway)' : 'SQLite (local)'}`);
});

export default app;
