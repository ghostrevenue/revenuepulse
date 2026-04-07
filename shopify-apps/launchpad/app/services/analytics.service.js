import { Campaign } from '../campaign.js';
import { WaitlistSubscriber } from '../waitlist.js';
import { Referral } from '../referral.js';

export const analyticsService = {
  getDashboard: (storeId) => {
    const campaigns = Campaign.findByStore(storeId);
    const totalSignups = campaigns.reduce((sum, c) => sum + c.signup_count, 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalReferrals = campaigns.reduce((sum, c) => {
      const stats = Referral.getStats(c.id);
      return sum + (stats?.total_referral_signups || 0);
    }, 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalSignups,
      totalReferrals,
      referralRate: totalSignups > 0 ? ((totalReferrals / totalSignups) * 100).toFixed(1) : 0,
      campaigns: campaigns.slice(0, 10)
    };
  },

  getCampaignAnalytics: (campaignId) => {
    const campaign = Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const subscribers = WaitlistSubscriber.findByCampaign(campaignId);
    const referralStats = Referral.getStats(campaignId);
    const topReferrers = Referral.getTopReferrers(campaignId, 5);

    const signupsByDay = {};
    for (const sub of subscribers) {
      const day = sub.created_at.split('T')[0];
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    }

    return {
      campaign,
      totalSignups: subscribers.length,
      notifiedCount: subscribers.filter(s => s.notified).length,
      convertedCount: subscribers.filter(s => s.converted).length,
      referralRate: subscribers.length > 0 
        ? ((referralStats?.total_referral_signups / subscribers.length) * 100).toFixed(1)
        : 0,
      referralStats,
      topReferrers,
      signupsByDay,
      conversionRate: subscribers.length > 0
        ? ((subscribers.filter(s => s.converted).length / subscribers.length) * 100).toFixed(1)
        : 0
    };
  },

  predictLaunchTraffic: (campaignId) => {
    const subscribers = WaitlistSubscriber.findByCampaign(campaignId);
    const totalSubscribers = subscribers.length;
    const estimatedOpenRate = 0.35;
    const estimatedClickRate = 0.15;
    const estimatedConversionRate = 0.08;

    return {
      expectedEmailsOpened: Math.round(totalSubscribers * estimatedOpenRate),
      expectedClicks: Math.round(totalSubscribers * estimatedClickRate),
      expectedPurchases: Math.round(totalSubscribers * estimatedConversionRate),
      estimatedTrafficSpike: Math.round(totalSubscribers * 0.5)
    };
  }
};
