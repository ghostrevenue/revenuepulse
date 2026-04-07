import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase } from './app/models/db.js';
import authRoutes from './app/routes/auth.routes.js';
import subscriptionsRoutes from './app/routes/subscriptions.routes.js';
import plansRoutes from './app/routes/plans.routes.js';
import ordersRoutes from './app/routes/orders.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import billingRoutes from './app/routes/billing.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// Serve static frontend
app.use(express.static(join(__dirname, 'app/frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'app/frontend/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`QuickReorder app running on port ${PORT}`);
  console.log(`Shopify API Key: ${process.env.SHOPIFY_API_KEY || 'not set'}`);
});

export default app;
