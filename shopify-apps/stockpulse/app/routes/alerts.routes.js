import express from 'express';
import { AlertModel } from '../models/alert.js';

const router = express.Router();

// Get all alert configs
router.get('/configs', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const configs = AlertModel.getConfigs(storeId);
  res.json({ configs });
});

// Create alert config
router.post('/configs', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { productId, global, threshold, alertType, email, sms, webhookUrl } = req.body;
  
  const result = AlertModel.createConfig({
    storeId, productId, global: global ? 1 : 0, threshold, alertType, email, sms: sms ? 1 : 0, webhookUrl
  });
  
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update alert config
router.put('/configs/:id', (req, res) => {
  const { threshold, email, sms, webhookUrl } = req.body;
  AlertModel.updateConfig(req.params.id, { threshold, email, sms: sms ? 1 : 0, webhookUrl });
  res.json({ success: true });
});

// Get alert history
router.get('/history', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const alerts = AlertModel.findAll(storeId);
  res.json({ alerts });
});

// Get unacknowledged alerts
router.get('/pending', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const alerts = AlertModel.getUnacknowledged(storeId);
  res.json({ alerts, count: alerts.length });
});

// Acknowledge alert
router.post('/:id/acknowledge', (req, res) => {
  AlertModel.acknowledge(req.params.id);
  res.json({ success: true });
});

// Trigger test alert
router.post('/test', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { productId } = req.body;
  
  AlertModel.create({
    storeId,
    productId,
    threshold: 10,
    alertType: 'test',
    sentAt: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Test alert sent' });
});

export default router;