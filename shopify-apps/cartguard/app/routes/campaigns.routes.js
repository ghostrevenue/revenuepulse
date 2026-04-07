import { Router } from 'express';
import { 
  createCampaign, getCampaign, getCampaigns, 
  updateCampaign, deleteCampaign, incrementCampaignStats 
} from '../models/campaign.js';

const router = Router();

// Get all campaigns for a store
router.get('/', (req, res) => {
  const { store_id, status } = req.query;
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const campaigns = getCampaigns(store_id, status);
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single campaign
router.get('/:id', (req, res) => {
  try {
    const campaign = getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create campaign
router.post('/', (req, res) => {
  const { store_id, name, type, status, trigger_config, offer_config, display_config } = req.body;
  
  if (!store_id || !name || !type) {
    return res.status(400).json({ error: 'Missing required fields: store_id, name, type' });
  }
  
  try {
    const campaign = createCampaign({
      store_id, name, type, status, trigger_config, offer_config, display_config
    });
    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update campaign
router.put('/:id', (req, res) => {
  try {
    const campaign = updateCampaign(req.params.id, req.body);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete campaign
router.delete('/:id', (req, res) => {
  try {
    deleteCampaign(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment stats
router.post('/:id/stats', (req, res) => {
  const { field, value } = req.body;
  if (!field) {
    return res.status(400).json({ error: 'Missing field' });
  }
  
  try {
    incrementCampaignStats(req.params.id, field, value || 1);
    const campaign = getCampaign(req.params.id);
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
