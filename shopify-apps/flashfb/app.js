import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './app/routes/auth.routes.js';
import pixelRoutes from './app/routes/pixel.routes.js';
import eventsRoutes from './app/routes/events.routes.js';
import audiencesRoutes from './app/routes/audiences.routes.js';
import conversionsRoutes from './app/routes/conversions.routes.js';
import analyticsRoutes from './app/routes/analytics.routes.js';
import billingRoutes from './app/routes/billing.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for Shopify embedded app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pixel', pixelRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/audiences', audiencesRoutes);
app.use('/api/conversions', conversionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'FlashFB', timestamp: new Date().toISOString() });
});

// Serve React frontend
app.use(express.static(join(__dirname, 'app/frontend')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'app/frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`FlashFB app running on port ${PORT}`);
});

export default app;
