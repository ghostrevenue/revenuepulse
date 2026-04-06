import express from 'express';
import crypto from 'crypto';
import db from '../models/db.js';

const router = express.Router();

// Verify Shopify webhook HMAC signature
function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const shopDomain = req.headers['x-shopify-shop-domain'];

  if (!hmacHeader || !shopDomain) {
    return res.status(401).json({ error: 'Missing Shopify webhook headers' });
  }

  const secret = process.env.SHOPIFY_API_SECRET || '';
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  if (hash !== hmacHeader) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  req.shopDomain = shopDomain;
  next();
}

// GDPR: Customer data request
router.post('/customers/data_request', verifyShopifyWebhook, async (req, res) => {
  const { customer } = req.body;

  // Log the request
  try {
    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO gdpr_logs (store_id, webhook_type, status)
        VALUES ($1, $2, $3)
      `).run(req.shopDomain, 'customers/data_request', 'received');
    } else {
      db.prepare(`
        INSERT INTO gdpr_logs (store_id, webhook_type, status)
        VALUES (?, ?, ?)
      `).run(req.shopDomain, 'customers/data_request', 'received');
    }
  } catch (e) {
    // Non-fatal — log and continue
    console.error('GDPR log error:', e.message);
  }

  // In production: collect and export all customer data
  // For now, respond with acknowledgment
  res.status(200).json({
    success: true,
    message: 'Customer data request received',
    customer_id: customer?.id,
    shop: req.shopDomain
  });
});

// GDPR: Customer data redact
router.post('/customers/redact', verifyShopifyWebhook, async (req, res) => {
  const { customer } = req.body;

  try {
    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO gdpr_logs (store_id, webhook_type, status)
        VALUES ($1, $2, $3)
      `).run(req.shopDomain, 'customers/redact', 'received');
    } else {
      db.prepare(`
        INSERT INTO gdpr_logs (store_id, webhook_type, status)
        VALUES (?, ?, ?)
      `).run(req.shopDomain, 'customers/redact', 'received');
    }
  } catch (e) {
    console.error('GDPR log error:', e.message);
  }

  // In production: redact/anonymize customer data from the app's database
  // RevenuePulse stores aggregate data, not PII — mark for deletion
  res.status(200).json({
    success: true,
    message: 'Customer data redaction acknowledged',
    customer_id: customer?.id,
    shop: req.shopDomain
  });
});

// GDPR: Shop data redact
router.post('/shop/redact', verifyShopifyWebhook, async (req, res) => {
  try {
    if (db.usePostgres) {
      await db.prepare(`
        INSERT INTO gdpr_logs (store_id, webhook_type, status)
        VALUES ($1, $2, $3)
      `).run(req.shopDomain, 'shop/redact', 'received');
    } else {
      db.prepare(`
        INSERT INTO gdpr_logs (store_id, webhook_type, status)
        VALUES (?, ?, ?)
      `).run(req.shopDomain, 'shop/redact', 'received');
    }
  } catch (e) {
    console.error('GDPR log error:', e.message);
  }

  // In production: full store data deletion
  res.status(200).json({
    success: true,
    message: 'Shop data redaction acknowledged',
    shop: req.shopDomain
  });
});

export default router;
