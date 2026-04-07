import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './app/models/db.js';

import authRoutes from './app/routes/auth.routes.js';
import productsRoutes from './app/routes/products.routes.js';
import alertsRoutes from './app/routes/alerts.routes.js';
import suppliersRoutes from './app/routes/suppliers.routes.js';
import locationsRoutes from './app/routes/locations.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import billingRoutes from './app/routes/billing.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.APP_PORT || 3004;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend
app.use(express.static(path.join(__dirname, 'app/frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Root - serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/frontend', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'StockPulse', port: PORT });
});

app.listen(PORT, () => {
  console.log(`StockPulse app running on port ${PORT}`);
});

export default app;