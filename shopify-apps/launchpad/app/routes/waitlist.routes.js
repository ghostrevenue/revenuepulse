import express from 'express';
import { waitlistService } from '../services/waitlist.service.js';
import { referralService } from '../services/referral.service.js';

const router = express.Router();

router.get('/campaigns/:campaignId/waitlist', (req, res) => {
  const { campaignId } = req.params;
  const { search } = req.query;
  
  let subscribers;
  if (search) {
    subscribers = waitlistService.searchSubscribers(campaignId, search);
  } else {
    subscribers = waitlistService.getSubscribers(campaignId);
  }
  
  const stats = waitlistService.getStats(campaignId);
  res.json({ subscribers, stats });
});

router.post('/campaigns/:campaignId/waitlist', (req, res) => {
  const { campaignId } = req.params;
  const { email, referredBy } = req.body;
  
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const subscriber = waitlistService.addSubscriber({ campaignId, email, referredByCode: referredBy });
    
    if (subscriber) {
      const referral = referralService.createReferral(subscriber.id, campaignId);
      return res.status(201).json({ subscriber, referralCode: referral.code });
    }
    res.status(201).json({ subscriber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/waitlist/export/:campaignId', (req, res) => {
  const csv = waitlistService.exportToCsv(req.params.campaignId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="waitlist-${req.params.campaignId}.csv"`);
  res.send(csv);
});

router.put('/waitlist/:id/converted', (req, res) => {
  waitlistService.markConverted(req.params.id);
  res.json({ success: true });
});

export default router;
