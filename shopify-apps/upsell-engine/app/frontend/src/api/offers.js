// Offers API Service
// Handles CRUD operations for upsell offers

const API_BASE = '/api/offers';

export const offersApi = {
  // Get all offers
  async getAll() {
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  },

  // Get single offer by ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch offer');
      return await response.json();
    } catch (error) {
      console.error('Error fetching offer:', error);
      throw error;
    }
  },

  // Create new offer
  async create(offerData) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return await response.json();
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  },

  // Update existing offer
  async update(id, offerData) {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) throw new Error('Failed to update offer');
      return await response.json();
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  },

  // Delete offer
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete offer');
      return await response.json();
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  },

  // Duplicate offer
  async duplicate(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to duplicate offer');
      return await response.json();
    } catch (error) {
      console.error('Error duplicating offer:', error);
      throw error;
    }
  },

  // Archive offer
  async archive(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}/archive`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to archive offer');
      return await response.json();
    } catch (error) {
      console.error('Error archiving offer:', error);
      throw error;
    }
  },

  // Toggle offer status (active/draft)
  async toggleStatus(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}/toggle-status`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle offer status');
      return await response.json();
    } catch (error) {
      console.error('Error toggling offer status:', error);
      throw error;
    }
  },
};

export default offersApi;
