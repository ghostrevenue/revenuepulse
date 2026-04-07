import { Campaign } from '../campaign.js';

export const campaignService = {
  create: (data) => {
    return Campaign.create(data);
  },

  getById: (id) => {
    return Campaign.findById(id);
  },

  getByStore: (storeId) => {
    return Campaign.findByStore(storeId);
  },

  update: (id, updates) => {
    return Campaign.update(id, updates);
  },

  delete: (id) => {
    return Campaign.delete(id);
  },

  activate: (id) => {
    return Campaign.update(id, { status: 'active' });
  },

  launch: (id) => {
    return Campaign.update(id, { status: 'launched' });
  },

  end: (id) => {
    return Campaign.update(id, { status: 'ended' });
  },

  getDashboard: (storeId) => {
    const stats = Campaign.getStats(storeId);
    const activeCampaigns = Campaign.findByStore(storeId).filter(c => c.status === 'active');
    const upcomingLaunches = activeCampaigns
      .filter(c => c.launch_date)
      .sort((a, b) => new Date(a.launch_date) - new Date(b.launch_date))
      .slice(0, 5);
    return { stats, activeCampaigns, upcomingLaunches };
  }
};
