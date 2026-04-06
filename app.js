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

app.use('/api/auth', authRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/billing', billingRoutes);
app.use('/webhooks', webhooksRoutes);

// ─── Embedded App: Shopify App Bridge config endpoint ──────────────────────────
// Shopify App Bridge requires an initialization config passed to the frontend
app.get('/api/app-bridge-config', (req, res) => {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const shop = req.query.shop;
  const appUrl = process.env.APP_URL || `https://revenuepulse.up.railway.app`;

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

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  // Serve React app for embedded Shopify app
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
