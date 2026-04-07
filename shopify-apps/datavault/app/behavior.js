export function logBehaviorEvent(db, storeId, customerId, eventType, productId, amount, metadata = {}) {
  const result = db.prepare(`
    INSERT INTO behavior_events (store_id, customer_id, event_type, product_id, amount, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(storeId, customerId, eventType, productId, amount, JSON.stringify(metadata));
  return result.lastInsertRowid;
}

export function getBehaviorEvents(db, storeId, options = {}) {
  const { customerId, eventType, limit = 100, offset = 0 } = options;
  
  let query = 'SELECT * FROM behavior_events WHERE store_id = ?';
  const params = [storeId];
  
  if (customerId) {
    query += ' AND customer_id = ?';
    params.push(customerId);
  }
  
  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.prepare(query).all(...params);
}

export function getCustomerBehaviorSummary(db, storeId, customerId) {
  const events = db.prepare(`
    SELECT event_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
    FROM behavior_events
    WHERE store_id = ? AND customer_id = ?
    GROUP BY event_type
  `).all(storeId, customerId);
  
  const summary = {
    purchases: 0,
    abandons: 0,
    browses: 0,
    total_spent: 0,
    total_abandoned: 0
  };
  
  events.forEach(e => {
    if (e.event_type === 'purchase') {
      summary.purchases = e.count;
      summary.total_spent = e.total_amount;
    } else if (e.event_type === 'abandon') {
      summary.abandons = e.count;
      summary.total_abandoned = e.total_amount;
    } else if (e.event_type === 'browse') {
      summary.browses = e.count;
    }
  });
  
  return summary;
}

export function getRecentAbandonedCarts(db, storeId, daysAgo = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  
  return db.prepare(`
    SELECT be.*, c.email, c.first_name, c.last_name
    FROM behavior_events be
    JOIN customers c ON be.customer_id = c.id
    WHERE be.store_id = ? AND be.event_type = 'abandon' AND be.created_at >= ?
    ORDER BY be.created_at DESC
  `).all(storeId, cutoff.toISOString());
}
