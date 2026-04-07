// Products API Service
// Handles product search and fetching from Shopify

const API_BASE = '/api/products';

export const productsApi = {
  // Search products
  async search(query) {
    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search products');
      return await response.json();
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get product by ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Get all products with pagination
  async getAll(page = 1, limit = 50) {
    try {
      const response = await fetch(`${API_BASE}?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get products by collection
  async getByCollection(collectionId) {
    try {
      const response = await fetch(`${API_BASE}/collection/${collectionId}`);
      if (!response.ok) throw new Error('Failed to fetch collection products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching collection products:', error);
      throw error;
    }
  },

  // Get product recommendations for upsell
  async getRecommendations(productIds = []) {
    try {
      const response = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  // Check product availability
  async checkAvailability(productId, variants = []) {
    try {
      const response = await fetch(`${API_BASE}/${productId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variants }),
      });
      if (!response.ok) throw new Error('Failed to check availability');
      return await response.json();
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },
};

export default productsApi;
