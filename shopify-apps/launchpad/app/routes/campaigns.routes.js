import express from 'express';
import { campaignService } from '../services/campaign.service.js';
import { waitlistService } from '../services/waitlist.service.js';
import { analyticsService } from '../services/analytics.service.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'Shop required' });
  
  const campaigns = campaignService.getByStore(shop);
  res.json({ campaigns });
});

router.post('/', (req, res) => {
  const { storeId, productId, name, headline, description, launchDate } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const campaign = campaignService.create({
    storeId, productId, name, headline, description, launchDate
  });
  res.status(201).json({ campaign });
});

router.get('/:id', (req, res) => {
  const campaign = campaignService.getById(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ campaign });
});

router.put('/:id', (req, res) => {
  const { name, headline, description, launchDate, status } = req.body;
  campaignService.update(req.params.id, { name, headline, description, launchDate, status });
  const campaign = campaignService.getById(req.params.id);
  res.json({ campaign });
});

router.delete('/:id', (req, res) => {
  campaignService.delete(req.params.id);
  res.json({ success: true });
});

router.post('/:id/activate', (req, res) => {
  campaignService.activate(req.params.id);
  const campaign = campaignService.getById(req.params.id);
  res.json({ campaign });
});

router.post('/:id/launch', (req, res) => {
  campaignService.launch(req.params.id);
  const campaign = campaignService.getById(req.params.id);
  res.json({ campaign });
});

router.post('/:id/end', (req, res) => {
  campaignService.end(req.params.id);
  const campaign = campaignService.getById(req.params.id);
  res.json({ campaign });
});

router.get('/:id/analytics', (req, res) => {
  const analytics = analyticsService.getCampaignAnalytics(req.params.id);
  res.json(analytics);
});

export default router;
