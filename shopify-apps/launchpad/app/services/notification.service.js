import { WaitlistSubscriber } from '../waitlist.js';
import { Campaign } from '../campaign.js';

export const notificationService = {
  sendLaunchNotification: async (campaignId, customMessage) => {
    const campaign = Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const subscribers = WaitlistSubscriber.findByCampaign(campaignId);
    
    const results = { sent: 0, failed: 0, errors: [] };
    
    for (const subscriber of subscribers) {
      try {
        await notificationService.sendEmail({
          to: subscriber.email,
          subject: `🎉 ${campaign.name} is now live!`,
          body: customMessage || notificationService.getDefaultTemplate(campaign),
          subscriberId: subscriber.id
        });
        WaitlistSubscriber.markNotified(subscriber.id);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ email: subscriber.email, error: error.message });
      }
    }

    return results;
  },

  sendEmail: async ({ to, subject, body, subscriberId }) => {
    console.log(`[Email] To: ${to}, Subject: ${subject}`);
    return { success: true, to, subject };
  },

  getDefaultTemplate: (campaign) => {
    return `
Hi there!

Great news — ${campaign.name} is now LIVE!

${campaign.headline || 'Our waitlist has ended and the product is now available for purchase.'}

${campaign.description || ''}

Don't miss out — early access subscribers get priority!

Shop now: https://your-store.myshopify.com/products/${campaign.product_id}

Thanks for being part of our launch community!

The LaunchPad Team
    `.trim();
  },

  previewEmail: (campaignId) => {
    const campaign = Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    return {
      subject: `🎉 ${campaign.name} is now live!`,
      body: notificationService.getDefaultTemplate(campaign)
    };
  },

  sendEarlyAccess: async (campaignId, subscriberIds) => {
    const campaign = Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const results = { sent: 0, failed: 0 };
    for (const id of subscriberIds) {
      try {
        await notificationService.sendEmail({
          to: 'subscriber@example.com',
          subject: `⏰ Early Access: ${campaign.name}`,
          body: `You have early access to ${campaign.name}! Shop before anyone else.`,
          subscriberId: id
        });
        results.sent++;
      } catch {
        results.failed++;
      }
    }
    return results;
  }
};
