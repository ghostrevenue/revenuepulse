// Targeting API Service
// Handles fetching products, collections, and tags for offer builder targeting conditions

const API_BASE = '/api/targeting';

export const targetingApi = {
  // Search products for targeting
  async searchProducts(query) {
    try {
      const response = await fetch(`${API_BASE}/products?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error searching products for targeting:', error);
      throw error;
    }
  },

  // Get all products with pagination
  async getProducts(page = 1, limit = 50) {
    try {
      const response = await fetch(`${API_BASE}/products?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products for targeting:', error);
      throw error;
    }
  },

  // Get all collections for targeting
  async getCollections() {
    try {
      const response = await fetch(`${API_BASE}/collections`);
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      return data.collections || [];
    } catch (error) {
      console.error('Error fetching collections for targeting:', error);
      throw error;
    }
  },

  // Get all customer tags for targeting
  async getCustomerTags() {
    try {
      const response = await fetch(`${API_BASE}/tags`);
      if (!response.ok) throw new Error('Failed to fetch customer tags');
      const data = await response.json();
      return data.tags || [];
    } catch (error) {
      console.error('Error fetching customer tags for targeting:', error);
      throw error;
    }
  },
};

export default targetingApi;