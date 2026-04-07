// Billing API Service
// Handles subscription management and billing operations

const API_BASE = '/api/billing';

export const billingApi = {
  // Get current subscription status
  async getSubscription() {
    try {
      const response = await fetch(`${API_BASE}/subscription`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return await response.json();
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  },

  // Get available plans
  async getPlans() {
    try {
      const response = await fetch(`${API_BASE}/plans`);
      if (!response.ok) throw new Error('Failed to fetch plans');
      return await response.json();
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Activate subscription with a plan
  async activatePlan(planId, billingCycle = 'monthly') {
    try {
      const response = await fetch(`${API_BASE}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, billingCycle }),
      });
      if (!response.ok) throw new Error('Failed to activate plan');
      return await response.json();
    } catch (error) {
      console.error('Error activating plan:', error);
      throw error;
    }
  },

  // Change billing cycle (monthly/annual)
  async changeBillingCycle(billingCycle) {
    try {
      const response = await fetch(`${API_BASE}/billing-cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billingCycle }),
      });
      if (!response.ok) throw new Error('Failed to change billing cycle');
      return await response.json();
    } catch (error) {
      console.error('Error changing billing cycle:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription() {
    try {
      const response = await fetch(`${API_BASE}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return await response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  // Get usage stats
  async getUsageStats() {
    try {
      const response = await fetch(`${API_BASE}/usage`);
      if (!response.ok) throw new Error('Failed to fetch usage stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  },

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await fetch(`${API_BASE}/payment-methods`);
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Update payment method
  async updatePaymentMethod(paymentMethodId) {
    try {
      const response = await fetch(`${API_BASE}/payment-method`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      });
      if (!response.ok) throw new Error('Failed to update payment method');
      return await response.json();
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  },

  // Get billing history/invoices
  async getBillingHistory(limit = 10) {
    try {
      const response = await fetch(`${API_BASE}/history?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch billing history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  },

  // Start free trial
  async startFreeTrial(planId) {
    try {
      const response = await fetch(`${API_BASE}/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });
      if (!response.ok) throw new Error('Failed to start free trial');
      return await response.json();
    } catch (error) {
      console.error('Error starting free trial:', error);
      throw error;
    }
  },
};

export default billingApi;
