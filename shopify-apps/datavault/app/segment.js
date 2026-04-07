export function getSegments(db, storeId) {
  return db.prepare('SELECT * FROM segments WHERE store_id = ? ORDER BY created_at DESC').all(storeId);
}

export function getSegmentById(db, storeId, segmentId) {
  return db.prepare('SELECT * FROM segments WHERE store_id = ? AND id = ?').get(storeId, segmentId);
}

export function createSegment(db, storeId, name, description, rules) {
  const result = db.prepare(`
    INSERT INTO segments (store_id, name, description, rules) VALUES (?, ?, ?, ?)
  `).run(storeId, name, description, JSON.stringify(rules));
  return result.lastInsertRowid;
}

export function updateSegment(db, storeId, segmentId, name, description, rules) {
  db.prepare(`
    UPDATE segments SET name = ?, description = ?, rules = ?, updated_at = CURRENT_TIMESTAMP
    WHERE store_id = ? AND id = ?
  `).run(name, description, JSON.stringify(rules), storeId, segmentId);
}

export function deleteSegment(db, storeId, segmentId) {
  db.prepare('DELETE FROM segments WHERE store_id = ? AND id = ?').run(storeId, segmentId);
}

export function countMatchingCustomers(db, storeId, rules) {
  if (!rules || rules.length === 0) {
    return db.prepare('SELECT COUNT(*) as count FROM customers WHERE store_id = ?').get(storeId).count;
  }
  
  let query = 'SELECT COUNT(*) as count FROM customers WHERE store_id = ?';
  const params = [storeId];
  
  const conditions = rules.map(rule => {
    const field = rule.field;
    const operator = rule.operator;
    const value = rule.value;
    
    switch (operator) {
      case 'gt': return `${field} > ?`;
      case 'gte': return `${field} >= ?`;
      case 'lt': return `${field} < ?`;
      case 'lte': return `${field} <= ?`;
      case 'eq': return `${field} = ?`;
      case 'neq': return `${field} != ?`;
      case 'contains': return `${field} LIKE ?`;
      default: return `${field} = ?`;
    }
  });
  
  // Default to AND logic, can be extended for OR
  query += ' AND ' + conditions.join(' AND ');
  
  rules.forEach(rule => {
    if (rule.operator === 'contains') {
      params.push(`%${rule.value}%`);
    } else {
      params.push(rule.value);
    }
  });
  
  return db.prepare(query).get(...params).count;
}

export function getCustomersInSegment(db, storeId, rules, options = {}) {
  const { sort = 'total_spent DESC', limit = 100, offset = 0 } = options;
  
  if (!rules || rules.length === 0) {
    return db.prepare(`SELECT * FROM customers WHERE store_id = ? ORDER BY ${sort} LIMIT ? OFFSET ?`)
      .all(storeId, limit, offset);
  }
  
  let query = 'SELECT * FROM customers WHERE store_id = ?';
  const params = [storeId];
  
  const conditions = rules.map(rule => {
    const field = rule.field;
    const operator = rule.operator;
    const value = rule.value;
    
    switch (operator) {
      case 'gt': return `${field} > ?`;
      case 'gte': return `${field} >= ?`;
      case 'lt': return `${field} < ?`;
      case 'lte': return `${field} <= ?`;
      case 'eq': return `${field} = ?`;
      case 'neq': return `${field} != ?`;
      case 'contains': return `${field} LIKE ?`;
      default: return `${field} = ?`;
    }
  });
  
  query += ' AND ' + conditions.join(' AND ');
  query += ` ORDER BY ${sort} LIMIT ? OFFSET ?`;
  
  rules.forEach(rule => {
    if (rule.operator === 'contains') {
      params.push(`%${rule.value}%`);
    } else {
      params.push(rule.value);
    }
  });
  
  params.push(limit, offset);
  
  return db.prepare(query).all(...params);
}
