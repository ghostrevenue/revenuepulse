import { Referral } from '../referral.js';

export const referralService = {
  createReferral: (subscriberId, campaignId) => {
    const existing = Referral.findBySubscriber(subscriberId);
    if (existing) return existing;
    return Referral.create({ subscriberId, campaignId });
  },

  getByCode: (code) => {
    return Referral.findByCode(code);
  },

  getBySubscriber: (subscriberId) => {
    return Referral.findBySubscriber(subscriberId);
  },

  getByCampaign: (campaignId) => {
    return Referral.findByCampaign(campaignId);
  },

  recordClick: (code) => {
    return Referral.incrementClicks(code);
  },

  getTopReferrers: (campaignId, limit = 10) => {
    return Referral.getTopReferrers(campaignId, limit);
  },

  getStats: (campaignId) => {
    return Referral.getStats(campaignId);
  },

  getShareUrl: (code, storeDomain) => {
    return `https://${storeDomain}/a/launchpad/join?ref=${code}`;
  }
};
