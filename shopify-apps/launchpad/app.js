import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './app/routes/auth.routes.js';
import campaignsRoutes from './app/routes/campaigns.routes.js';
import waitlistRoutes from './app/routes/waitlist.routes.js';
import notificationsRoutes from './app/routes/notifications.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import billingRoutes from './app/routes/billing.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use('/auth', authRoutes);
app.use('/api', campaignsRoutes);
app.use('/api', waitlistRoutes);
app.use('/api', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'LaunchPad', port: PORT });
});

app.get('/', (req, res) => {
  res.json({
    name: 'LaunchPad',
    description: 'Pre-launch waitlist & countdown app for Shopify',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      api: '/api/campaigns'
    }
  });
});

app.use('/admin', express.static(join(__dirname, 'app/frontend')));

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'app/frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`LaunchPad app running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

export default app;
