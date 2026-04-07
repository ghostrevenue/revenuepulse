import express from 'express';

const router = express.Router();

// Get all reports
router.get('/', (req, res) => {
  try {
    const reports = req.db.prepare('SELECT * FROM reports WHERE store_id = ? ORDER BY created_at DESC')
      .all(req.store.id);
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate custom report
router.post('/generate', (req, res) => {
  try {
    const { metrics, group_by, filters, date_range } = req.body;
    
    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({ error: 'metrics array is required' });
    }
    
    // Build query based on metrics
    const validMetrics = ['total_orders', 'total_spent', 'avg_order_value', 'customer_count', 'new_customers'];
    const selectedMetrics = metrics.filter(m => validMetrics.includes(m));
    
    let query = 'SELECT ';
    query += selectedMetrics.map(m => {
      switch (m) {
        case 'total_orders': return 'SUM(total_orders) as total_orders';
        case 'total_spent': return 'SUM(total_spent) as total_spent';
        case 'avg_order_value': return 'AVG(avg_order_value) as avg_order_value';
        case 'customer_count': return 'COUNT(*) as customer_count';
        case 'new_customers': return "COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_customers";
        default: return m;
      }
    }).join(', ');
    
    query += ' FROM customers WHERE store_id = ?';
    const params = [req.store.id];
    
    // Apply filters
    if (filters) {
      if (filters.min_spent) {
        query += ' AND total_spent >= ?';
        params.push(filters.min_spent);
      }
      if (filters.max_spent) {
        query += ' AND total_spent <= ?';
        params.push(filters.max_spent);
      }
      if (filters.min_orders) {
        query += ' AND total_orders >= ?';
        params.push(filters.min_orders);
      }
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => {
          query += ' AND tags LIKE ?';
          params.push(`%"${tag}"%`);
        });
      }
    }
    
    const result = req.db.prepare(query).get(...params);
    
    res.json({ report: result, generated_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save report configuration
router.post('/', (req, res) => {
  try {
    const { name, metrics, group_by, filters } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const result = req.db.prepare(`
      INSERT INTO reports (store_id, name, metrics, group_by, filters)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.store.id, name, JSON.stringify(metrics || []), group_by || null, JSON.stringify(filters || {}));
    
    res.json({ id: result.lastInsertRowid, message: 'Report saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export report to CSV
router.get('/:id/export', (req, res) => {
  try {
    const report = req.db.prepare('SELECT * FROM reports WHERE store_id = ? AND id = ?')
      .get(req.store.id, req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const metrics = JSON.parse(report.metrics || '[]');
    const filters = JSON.parse(report.filters || '{}');
    
    // Generate the report
    const reportReq = { body: { metrics, filters } };
    const reportRes = { json: (data) => data };
    
    // Reuse generate logic
    const result = req.db.prepare(`
      SELECT SUM(total_orders) as total_orders, SUM(total_spent) as total_spent,
             AVG(avg_order_value) as avg_order_value, COUNT(*) as customer_count
      FROM customers WHERE store_id = ?
    `).get(req.store.id);
    
    // Build CSV
    const headers = metrics.join(',');
    const values = metrics.map(m => result[m] || 0).join(',');
    const csv = `${headers}\n${values}`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
