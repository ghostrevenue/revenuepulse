import { WaitlistSubscriber } from '../waitlist.js';
import { Referral } from '../referral.js';
import { Campaign } from '../campaign.js';

export const waitlistService = {
  addSubscriber: ({ campaignId, email, referredByCode }) => {
    const existing = WaitlistSubscriber.findByEmail(campaignId, email);
    if (existing) {
      throw new Error('Email already registered for this campaign');
    }

    let referredById = null;
    if (referredByCode) {
      const referral = Referral.findByCode(referredByCode);
      if (referral) {
        referredById = referral.subscriber_id;
        Referral.incrementSignups(referredByCode);
      }
    }

    const result = WaitlistSubscriber.create({ campaignId, email, referredBy: referredById });
    if (referredById) {
      Referral.incrementSignups(referral.code);
    }

    Campaign.incrementSignupCount(campaignId);

    const subscriber = WaitlistSubscriber.findById(result.lastInsertRowid);
    return subscriber;
  },

  getSubscribers: (campaignId) => {
    return WaitlistSubscriber.findByCampaign(campaignId);
  },

  getSubscriber: (id) => {
    return WaitlistSubscriber.findById(id);
  },

  searchSubscribers: (campaignId, query) => {
    return WaitlistSubscriber.search(campaignId, query);
  },

  getStats: (campaignId) => {
    const count = WaitlistSubscriber.countByCampaign(campaignId);
    const referralStats = WaitlistSubscriber.getReferralStats(campaignId);
    return { total: count, ...referralStats };
  },

  exportToCsv: (campaignId) => {
    const subscribers = WaitlistSubscriber.findByCampaign(campaignId);
    const headers = ['Position', 'Email', 'Referred By', 'Notified', 'Converted', 'Joined'];
    const rows = subscribers.map(s => [
      s.position,
      s.email,
      s.referred_by || '',
      s.notified ? 'Yes' : 'No',
      s.converted ? 'Yes' : 'No',
      s.created_at
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  markConverted: (id) => {
    return WaitlistSubscriber.markConverted(id);
  }
};
