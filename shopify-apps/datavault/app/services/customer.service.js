import * as customerModel from '../customer.js';

export function getCustomerProfiles(db, storeId, options = {}) {
  return customerModel.getCustomers(db, storeId, options);
}

export function getCustomerProfile(db, storeId, customerId) {
  return customerModel.getCustomerById(db, storeId, customerId);
}

export function getCustomerStats(db, storeId) {
  return {
    total: customerModel.getCustomerCount(db, storeId),
    totalRevenue: customerModel.getTotalRevenue(db, storeId),
    avgLtv: customerModel.getAvgLtv(db, storeId),
    newToday: customerModel.getNewCustomersToday(db, storeId),
    atRisk: customerModel.getAtRiskCustomers(db, storeId)
  };
}

export function syncCustomer(db, storeId, shopifyCustomer) {
  return customerModel.upsertCustomer(db, storeId, {
    shopify_customer_id: shopifyCustomer.id.toString(),
    email: shopifyCustomer.email,
    first_name: shopifyCustomer.first_name,
    last_name: shopifyCustomer.last_name,
    total_orders: shopifyCustomer.orders_count || 0,
    total_spent: parseFloat(shopifyCustomer.total_spent || 0),
    avg_order_value: shopifyCustomer.orders_count > 0 
      ? parseFloat(shopifyCustomer.total_spent) / shopifyCustomer.orders_count 
      : 0,
    first_order_date: shopifyCustomer.created_at,
    last_order_date: shopifyCustomer.updated_at,
    tags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map(t => t.trim()) : []
  });
}
