// Analytics API Service
// Handles fetching analytics and performance data

const API_BASE = '/api/analytics';

export const analyticsApi = {
  // Get overall dashboard summary
  async getSummary() {
    try {
      const response = await fetch(`${API_BASE}/summary`);
      if (!response.ok) throw new Error('Failed to fetch analytics summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  // Get analytics with date range
  async getByDateRange(startDate, endDate) {
    try {
      const response = await fetch(
        `${API_BASE}?start=${startDate}&end=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Get revenue data over time
  async getRevenueData(period = '30d') {
    try {
      const response = await fetch(`${API_BASE}/revenue?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  },

  // Get funnel data (offered -> clicked -> purchased)
  async getFunnelData() {
    try {
      const response = await fetch(`${API_BASE}/funnel`);
      if (!response.ok) throw new Error('Failed to fetch funnel data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      throw error;
    }
  },

  // Get top performing offers
  async getTopOffers(limit = 10) {
    try {
      const response = await fetch(`${API_BASE}/top-offers?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top offers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching top offers:', error);
      throw error;
    }
  },

  // Get conversion rates over time
  async getConversionRates(period = '30d') {
    try {
      const response = await fetch(`${API_BASE}/conversion-rates?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch conversion rates');
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversion rates:', error);
      throw error;
    }
  },

  // Get activity feed
  async getActivityFeed(limit = 20) {
    try {
      const response = await fetch(`${API_BASE}/activity?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch activity feed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  },

  // Export analytics data
  async exportData(format = 'csv', startDate, endDate) {
    try {
      const response = await fetch(
        `${API_BASE}/export?format=${format}&start=${startDate}&end=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to export analytics');
      return await response.blob();
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  },
};

export default analyticsApi;
