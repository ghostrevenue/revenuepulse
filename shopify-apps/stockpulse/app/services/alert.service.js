import { AlertModel } from '../models/alert.js';

export const AlertService = {
  checkLowStock(product) {
    return product.quantity <= product.reorder_point;
  },
  
  checkOutOfStock(product) {
    return product.quantity === 0;
  },
  
  async sendAlert(storeId, productId, alertType, threshold) {
    const config = AlertModel.getConfigs(storeId).find(c => 
      c.global === 1 || c.product_id === productId
    );
    
    if (!config) return { sent: false, reason: 'No config found' };
    
    // In production, would send email/SMS/webhook here
    AlertModel.create({
      storeId,
      productId,
      threshold: config.threshold,
      alertType,
      sentAt: new Date().toISOString()
    });
    
    return { sent: true, type: alertType };
  },
  
  getUnacknowledged(storeId) {
    return AlertModel.getUnacknowledged(storeId);
  }
};