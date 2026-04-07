import db from '../models/db.js';

export const AnalyticsService = {
  getSalesVelocity(storeId, productId) {
    // Mock calculation - in production would analyze Shopify orders
    const velocity = Math.floor(Math.random() * 30) + 5;
    return velocity;
  },
  
  getStockHistory(storeId, productId, days = 30) {
    return db.prepare(`
      SELECT * FROM stock_history 
      WHERE store_id = ? AND product_id = ?
      AND created_at >= datetime('now', '-' || ? || ' days')
      ORDER BY created_at DESC
    `).all(storeId, productId, days);
  },
  
  getStockSummary(storeId) {
    const products = db.prepare('SELECT * FROM product_stocks WHERE store_id = ?').all(storeId);
    return {
      totalProducts: products.length,
      totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
      lowStock: products.filter(p => p.quantity <= p.reorder_point && p.quantity > 0).length,
      outOfStock: products.filter(p => p.quantity === 0).length
    };
  }
};