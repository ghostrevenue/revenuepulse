import express from 'express';
import { notificationService } from '../services/notification.service.js';

const router = express.Router();

router.post('/campaigns/:id/notify', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  
  try {
    const results = await notificationService.sendLaunchNotification(id, message);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/campaigns/:id/preview', (req, res) => {
  try {
    const preview = notificationService.previewEmail(req.params.id);
    res.json(preview);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/campaigns/:id/early-access', async (req, res) => {
  const { id } = req.params;
  const { subscriberIds } = req.body;
  
  try {
    const results = await notificationService.sendEarlyAccess(id, subscriberIds);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
