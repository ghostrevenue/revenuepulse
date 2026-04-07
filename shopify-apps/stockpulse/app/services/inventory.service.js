import { ProductStockModel } from '../models/product.js';

export const InventoryService = {
  getAllStock(storeId) {
    return ProductStockModel.findAll(storeId);
  },
  
  getLowStock(storeId) {
    return ProductStockModel.getLowStock(storeId);
  },
  
  getOutOfStock(storeId) {
    return ProductStockModel.getOutOfStock(storeId);
  },
  
  updateStock(id, quantity) {
    return ProductStockModel.updateQuantity(id, quantity);
  },
  
  bulkUpdateStock(items) {
    return ProductStockModel.bulkUpsert(items);
  }
};