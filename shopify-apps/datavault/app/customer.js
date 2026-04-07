export function getCustomers(db, storeId, options = {}) {
  const { sort = 'created_at DESC', limit = 50, offset = 0, search = '' } = options;
  
  let query = 'SELECT * FROM customers WHERE store_id = ?';
  const params = [storeId];
  
  if (search) {
    query += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ` ORDER BY ${sort} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  return db.prepare(query).all(...params);
}

export function getCustomerById(db, storeId, customerId) {
  return db.prepare('SELECT * FROM customers WHERE store_id = ? AND id = ?').get(storeId, customerId);
}

export function getCustomerCount(db, storeId) {
  return db.prepare('SELECT COUNT(*) as count FROM customers WHERE store_id = ?').get(storeId).count;
}

export function getTotalRevenue(db, storeId) {
  const result = db.prepare('SELECT COALESCE(SUM(total_spent), 0) as total FROM customers WHERE store_id = ?').get(storeId);
  return result.total;
}

export function getAvgLtv(db, storeId) {
  const result = db.prepare('SELECT COALESCE(AVG(total_spent), 0) as avg FROM customers WHERE store_id = ?').get(storeId);
  return result.avg;
}

export function getNewCustomersToday(db, storeId) {
  const today = new Date().toISOString().split('T')[0];
  const result = db.prepare("SELECT COUNT(*) as count FROM customers WHERE store_id = ? AND DATE(created_at) = ?").get(storeId, today);
  return result.count;
}

export function getAtRiskCustomers(db, storeId) {
  const result = db.prepare('SELECT COUNT(*) as count FROM customers WHERE store_id = ? AND churn_score > 70').get(storeId);
  return result.count;
}

export function upsertCustomer(db, storeId, customerData) {
  const existing = db.prepare('SELECT * FROM customers WHERE store_id = ? AND shopify_customer_id = ?')
    .get(storeId, customerData.shopify_customer_id);
  
  if (existing) {
    db.prepare(`
      UPDATE customers SET
        email = ?, first_name = ?, last_name = ?, total_orders = ?, total_spent = ?,
        avg_order_value = ?, first_order_date = ?, last_order_date = ?, tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      customerData.email, customerData.first_name, customerData.last_name,
      customerData.total_orders, customerData.total_spent, customerData.avg_order_value,
      customerData.first_order_date, customerData.last_order_date, JSON.stringify(customerData.tags || []),
      existing.id
    );
    return existing.id;
  } else {
    const result = db.prepare(`
      INSERT INTO customers (store_id, shopify_customer_id, email, first_name, last_name, 
        total_orders, total_spent, avg_order_value, first_order_date, last_order_date, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      storeId, customerData.shopify_customer_id, customerData.email, customerData.first_name,
      customerData.last_name, customerData.total_orders || 0, customerData.total_spent || 0,
      customerData.avg_order_value || 0, customerData.first_order_date, customerData.last_order_date,
      JSON.stringify(customerData.tags || [])
    );
    return result.lastInsertRowid;
  }
}

export function updateChurnScore(db, storeId, customerId, score) {
  db.prepare('UPDATE customers SET churn_score = ? WHERE store_id = ? AND id = ?').run(score, storeId, customerId);
}

export function updateRfmScore(db, storeId, customerId, score) {
  db.prepare('UPDATE customers SET rfm_score = ? WHERE store_id = ? AND id = ?').run(score, storeId, customerId);
}
