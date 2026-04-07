import db from './db.js';

export const ProductStockModel = {
  findAll(storeId) {
    return db.prepare('SELECT * FROM product_stocks WHERE store_id = ?').all(storeId);
  },
  findById(id) {
    return db.prepare('SELECT * FROM product_stocks WHERE id = ?').get(id);
  },
  findByProduct(storeId, productId) {
    return db.prepare('SELECT * FROM product_stocks WHERE store_id = ? AND product_id = ?').all(storeId, productId);
  },
  upsert(data) {
    const stmt = db.prepare(`
      INSERT INTO product_stocks (store_id, product_id, variant_id, location_id, quantity, reorder_point, reorder_quantity, last_restock_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(store_id, product_id, variant_id, location_id)
      DO UPDATE SET quantity = excluded.quantity, reorder_point = excluded.reorder_point, 
                    reorder_quantity = excluded.reorder_quantity, last_restock_date = excluded.last_restock_date,
                    updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(data.storeId, data.productId, data.variantId || null, data.locationId || null, 
                   data.quantity, data.reorderPoint || 0, data.reorderQuantity || 0, data.lastRestockDate || null);
  },
  bulkUpsert(items) {
    const stmt = db.prepare(`
      INSERT INTO product_stocks (store_id, product_id, variant_id, location_id, quantity, reorder_point, reorder_quantity, last_restock_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(store_id, product_id, variant_id, location_id)
      DO UPDATE SET quantity = excluded.quantity, reorder_point = excluded.reorder_point, 
                    reorder_quantity = excluded.reorder_quantity, last_restock_date = excluded.last_restock_date,
                    updated_at = CURRENT_TIMESTAMP
    `);
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.storeId, item.productId, item.variantId || null, item.locationId || null,
                item.quantity, item.reorderPoint || 0, item.reorderQuantity || 0, item.lastRestockDate || null);
      }
    });
    return insertMany(items);
  },
  getLowStock(storeId) {
    return db.prepare('SELECT * FROM product_stocks WHERE store_id = ? AND quantity <= reorder_point').all(storeId);
  },
  getOutOfStock(storeId) {
    return db.prepare('SELECT * FROM product_stocks WHERE store_id = ? AND quantity = 0').all(storeId);
  },
  updateQuantity(id, quantity) {
    return db.prepare('UPDATE product_stocks SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, id);
  }
};