import express from 'express';
import { getPixelConfig, getAllPixels, savePixelConfig, deletePixelConfig } from '../pixel.js';

const router = express.Router();

router.get('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const pixels = getAllPixels(storeId);
  res.json({ pixels });
});

router.get('/:storeId/config', (req, res) => {
  const { storeId } = req.params;
  const config = getPixelConfig(storeId);
  res.json({ config });
});

router.post('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const { pixel_id, access_token, test_event_id, enabled } = req.body;

  if (!pixel_id) {
    return res.status(400).json({ error: 'Pixel ID is required' });
  }

  const id = savePixelConfig({ store_id: storeId, pixel_id, access_token, test_event_id, enabled });
  res.json({ success: true, id });
});

router.post('/:storeId/test', async (req, res) => {
  const { storeId } = req.params;
  const { pixel_id, access_token, test_event_code } = req.body;

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixel_id}/events?access_token=${access_token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [{
          event_name: 'TestEvent',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_data: {
            fbp: 'fb.1.test',
            fbc: 'fb.1.test'
          }
        }],
        test_event_code: test_event_code
      })
    });

    const data = await response.json();
    if (data.events_received !== undefined) {
      return res.json({ success: true, events_received: data.events_received });
    }
    res.status(400).json({ error: data.error?.message || 'Test failed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:storeId/:pixelId', (req, res) => {
  const { storeId, pixelId } = req.params;
  deletePixelConfig(storeId, pixelId);
  res.json({ success: true });
});

export default router;
