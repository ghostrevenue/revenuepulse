import db from './db.js';

export const RevenueModel = {
  async getSummary(storeId, days = 30) {
    if (db.usePostgres) {
      const result = await db.query(`
        SELECT
          COALESCE(SUM(revenue), 0) as total_revenue,
          COALESCE(SUM(orders), 0) as total_orders,
          COALESCE(AVG(average_order_value), 0) as avg_order_value,
          COUNT(*) as days_tracked
        FROM revenue_data
        WHERE store_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
      `, [storeId, days]);
      return result.rows[0] || { total_revenue: 0, total_orders: 0, avg_order_value: 0, days_tracked: 0 };
    }
    return db.prepare(`
      SELECT
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM(orders), 0) as total_orders,
        COALESCE(AVG(average_order_value), 0) as avg_order_value,
        COUNT(*) as days_tracked
      FROM revenue_data
      WHERE store_id = ? AND date >= date('now', '-' || $1 || ' days')
    `).get(days, storeId);
  },

  async getDaily(storeId, days = 30) {
    if (db.usePostgres) {
      const result = await db.query(`
        SELECT date, revenue, orders, average_order_value
        FROM revenue_data
        WHERE store_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
        ORDER BY date ASC
      `, [storeId, days]);
      return result.rows;
    }
    return db.prepare(`
      SELECT date, revenue, orders, average_order_value
      FROM revenue_data
      WHERE store_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date ASC
    `).all(storeId, days);
  },

  async upsert(storeId, date, revenue, orders, aov) {
    if (db.usePostgres) {
      return db.query(`
        INSERT INTO revenue_data (store_id, date, revenue, orders, average_order_value)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (store_id, date) DO UPDATE SET
          revenue = EXCLUDED.revenue,
          orders = EXCLUDED.orders,
          average_order_value = EXCLUDED.average_order_value
      `, [storeId, date, revenue, orders, aov]);
    }
    return db.prepare(`
      INSERT INTO revenue_data (store_id, date, revenue, orders, average_order_value)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(store_id, date) DO UPDATE SET
        revenue = excluded.revenue,
        orders = excluded.orders,
        average_order_value = excluded.average_order_value
    `).run(storeId, date, revenue, orders, aov);
  }
};
