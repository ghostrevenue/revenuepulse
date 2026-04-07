import express from 'express';
import dotenv from 'dotenv';
import { initDb } from './app/models/db.js';
import { loadStore } from './app/store.js';
import authRoutes from './app/routes/auth.routes.js';
import customersRoutes from './app/routes/customers.routes.js';
import segmentsRoutes from './app/routes/segments.routes.js';
import cohortsRoutes from './app/routes/cohorts.routes.js';
import reportsRoutes from './app/routes/reports.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import billingRoutes from './app/routes/billing.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const db = initDb();

// Make db available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Load store from session/DB
app.use((req, res, next) => {
  req.store = loadStore(req, db);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/segments', segmentsRoutes);
app.use('/api/cohorts', cohortsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Serve frontend
app.use(express.static('app/frontend'));
app.get('*', (req, res) => {
  res.sendFile('app/frontend/index.html', { root: process.cwd() });
});

// Start server
app.listen(PORT, () => {
  console.log(`DataVault running on port ${PORT}`);
  console.log(`Shopify app URL: ${process.env.SHOPIFY_APP_URL || `http://localhost:${PORT}`}`);
});

export default app;
