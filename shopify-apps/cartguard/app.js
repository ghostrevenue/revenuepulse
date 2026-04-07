import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const DB_PATH = process.env.DB_PATH || './cartguard.db';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database is initialized before routes
const dbPath = DB_PATH.startsWith('/') ? DB_PATH : join(__dirname, DB_PATH);
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
import { initDB, getDB } from './app/models/db.js';
initDB(dbPath);

// Static files for frontend
app.use(express.static(join(__dirname, 'app', 'frontend')));

// API Routes
import authRoutes from './app/routes/auth.routes.js';
import campaignsRoutes from './app/routes/campaigns.routes.js';
import visitorsRoutes from './app/routes/visitors.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import couponsRoutes from './app/routes/coupons.routes.js';
import billingRoutes from './app/routes/billing.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/visitors', visitorsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'CartGuard', version: '1.0.0', port: PORT });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(__dirname, 'app', 'frontend', 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`CartGuard running on port ${PORT}`);
  console.log(`Admin UI: ${APP_URL}`);
  console.log(`Health: ${APP_URL}/health`);
});

export default app;
