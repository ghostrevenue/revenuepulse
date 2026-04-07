/**
 * ProofFlow - Settings Routes
 * App settings and email templates
 */

import express from 'express';
import { getStore } from '../models/store.js';
import { getDb } from '../models/db.js';

const router = express.Router();

const DEFAULT_SETTINGS = {
  email_subject: 'Share your experience with us!',
  email_body: `Hi {{customer_name}},

Thank you for your recent purchase! We would love to hear about your experience with {{product_name}}.

Your review helps other customers make informed decisions and helps us improve.

Leave your review: {{review_link}}

Thank you for being a valued customer!`,
  email_delay_days: 7,
  auto_requests_enabled: true,
  max_requests_per_month: 100,
  minimum_rating_threshold: 1,
  hide_negative_reviews: false,
  notification_style: 'popup',
  notification_position: 'bottom-left',
  notification_timeout: 5000
};

function requireAuth(req, res, next) {
  if (!req.session || !req.session.storeDomain) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const db = getDb();
    const stmt = db.prepare('SELECT * FROM app_settings WHERE store_id = ?');
    const settings = stmt.get(store.id);

    if (!settings) {
      return res.json({
        success: true,
        settings: { ...DEFAULT_SETTINGS, store_id: store.id }
      });
    }

    res.json({
      success: true,
      settings: {
        ...DEFAULT_SETTINGS,
        ...settings,
        hide_negative_reviews: !!settings.hide_negative_reviews,
        auto_requests_enabled: !!settings.auto_requests_enabled
      }
    });
  } catch (error) {
    console.error('[Settings] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const db = getDb();
    const {
      email_subject,
      email_body,
      email_delay_days,
      auto_requests_enabled,
      max_requests_per_month,
      minimum_rating_threshold,
      hide_negative_reviews,
      notification_style,
      notification_position,
      notification_timeout
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO app_settings 
        (store_id, email_subject, email_body, email_delay_days, auto_requests_enabled,
         max_requests_per_month, minimum_rating_threshold, hide_negative_reviews,
         notification_style, notification_position, notification_timeout)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(store_id) DO UPDATE SET
        email_subject = excluded.email_subject,
        email_body = excluded.email_body,
        email_delay_days = excluded.email_delay_days,
        auto_requests_enabled = excluded.auto_requests_enabled,
        max_requests_per_month = excluded.max_requests_per_month,
        minimum_rating_threshold = excluded.minimum_rating_threshold,
        hide_negative_reviews = excluded.hide_negative_reviews,
        notification_style = excluded.notification_style,
        notification_position = excluded.notification_position,
        notification_timeout = excluded.notification_timeout,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      store.id,
      email_subject || DEFAULT_SETTINGS.email_subject,
      email_body || DEFAULT_SETTINGS.email_body,
      email_delay_days || DEFAULT_SETTINGS.email_delay_days,
      auto_requests_enabled !== false ? 1 : 0,
      max_requests_per_month || DEFAULT_SETTINGS.max_requests_per_month,
      minimum_rating_threshold || DEFAULT_SETTINGS.minimum_rating_threshold,
      hide_negative_reviews ? 1 : 0,
      notification_style || DEFAULT_SETTINGS.notification_style,
      notification_position || DEFAULT_SETTINGS.notification_position,
      notification_timeout || DEFAULT_SETTINGS.notification_timeout
    );

    const getStmt = db.prepare('SELECT * FROM app_settings WHERE store_id = ?');
    const settings = getStmt.get(store.id);

    res.json({
      success: true,
      settings: {
        ...DEFAULT_SETTINGS,
        ...settings,
        hide_negative_reviews: !!settings.hide_negative_reviews,
        auto_requests_enabled: !!settings.auto_requests_enabled
      }
    });
  } catch (error) {
    console.error('[Settings] Update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/email-template', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const db = getDb();
    const stmt = db.prepare('SELECT email_subject, email_body FROM app_settings WHERE store_id = ?');
    const settings = stmt.get(store.id);

    res.json({
      success: true,
      template: {
        subject: settings?.email_subject || DEFAULT_SETTINGS.email_subject,
        body: settings?.email_body || DEFAULT_SETTINGS.email_body
      }
    });
  } catch (error) {
    console.error('[Settings] Email template error:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

router.put('/email-template', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO app_settings (store_id, email_subject, email_body)
      VALUES (?, ?, ?)
      ON CONFLICT(store_id) DO UPDATE SET
        email_subject = excluded.email_subject,
        email_body = excluded.email_body,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(store.id, subject, body);

    res.json({
      success: true,
      template: { subject, body }
    });
  } catch (error) {
    console.error('[Settings] Email template update error:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

router.post('/preview-email', (req, res) => {
  try {
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    const previewData = {
      customer_name: 'John Smith',
      product_name: 'Premium Wireless Headphones',
      order_number: '#1047',
      review_link: 'https://example.myshopify.com/products/headphones/reviews'
    };

    let previewSubject = subject;
    let previewBody = body;

    Object.entries(previewData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value);
      previewBody = previewBody.replace(new RegExp(placeholder, 'g'), value);
    });

    res.json({
      success: true,
      preview: {
        subject: previewSubject,
        body: previewBody
      }
    });
  } catch (error) {
    console.error('[Settings] Preview email error:', error);
    res.status(500).json({ error: 'Failed to preview email' });
  }
});

export default router;
