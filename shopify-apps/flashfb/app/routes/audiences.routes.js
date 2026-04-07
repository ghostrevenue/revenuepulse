import express from 'express';
import { createAudience, getAudiencesByStore, getAudienceById, updateAudience, deleteAudience } from '../audience.js';

const router = express.Router();

router.get('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const audiences = getAudiencesByStore(storeId);
  res.json({ audiences });
});

router.get('/:storeId/:id', (req, res) => {
  const { id } = req.params;
  const audience = getAudienceById(id);
  if (!audience) {
    return res.status(404).json({ error: 'Audience not found' });
  }
  res.json({ audience });
});

router.post('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const { name, audience_type, rules, fb_audience_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Audience name is required' });
  }

  const id = createAudience({ store_id: storeId, name, audience_type, rules, fb_audience_id });
  res.json({ success: true, id });
});

router.put('/:storeId/:id', (req, res) => {
  const { id } = req.params;
  const { name, rules, status, size, synced_at } = req.body;
  
  const updated = updateAudience(id, { name, rules, status, size, synced_at });
  res.json({ success: true, audience: updated });
});

router.delete('/:storeId/:id', (req, res) => {
  const { id } = req.params;
  deleteAudience(id);
  res.json({ success: true });
});

export default router;
