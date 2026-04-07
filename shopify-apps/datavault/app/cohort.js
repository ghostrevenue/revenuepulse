export function getCohortGroups(db, storeId) {
  return db.prepare('SELECT * FROM cohort_groups WHERE store_id = ? ORDER BY start_date DESC').all(storeId);
}

export function getCohortGroupById(db, storeId, cohortId) {
  return db.prepare('SELECT * FROM cohort_groups WHERE store_id = ? AND id = ?').get(storeId, cohortId);
}

export function createCohortGroup(db, storeId, name, startDate, endDate) {
  const result = db.prepare(`
    INSERT INTO cohort_groups (store_id, name, start_date, end_date) VALUES (?, ?, ?, ?)
  `).run(storeId, name, startDate, endDate);
  return result.lastInsertRowid;
}

export function getCohortData(db, cohortGroupId) {
  return db.prepare('SELECT * FROM cohort_data WHERE cohort_group_id = ?').all(cohortGroupId);
}

export function insertCohortData(db, cohortGroupId, customerId, data) {
  db.prepare(`
    INSERT INTO cohort_data (cohort_group_id, customer_id, month_0_retained, month_1_retained,
      month_2_retained, month_3_retained, month_4_retained, month_5_retained, month_6_retained)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cohortGroupId, customerId, data.month_0 || 1, data.month_1 || 0, data.month_2 || 0,
    data.month_3 || 0, data.month_4 || 0, data.month_5 || 0, data.month_6 || 0);
}

export function updateCohortRetention(db, cohortDataId, month, retained) {
  db.prepare(`UPDATE cohort_data SET month_${month}_retained = ? WHERE id = ?`).run(retained, cohortDataId);
}

export function calculateCohortRetention(db, storeId, cohortGroupId) {
  const customers = db.prepare(`
    SELECT c.*, cd.month_0_retained, cd.month_1_retained, cd.month_2_retained,
           cd.month_3_retained, cd.month_4_retained, cd.month_5_retained, cd.month_6_retained
    FROM customers c
    JOIN cohort_data cd ON c.id = cd.customer_id
    WHERE c.store_id = ? AND cd.cohort_group_id = ?
  `).all(storeId, cohortGroupId);
  
  if (customers.length === 0) return null;
  
  const totalCustomers = customers.length;
  const retention = {
    total: totalCustomers,
    months: []
  };
  
  for (let i = 0; i <= 6; i++) {
    const retained = customers.filter(c => c[`month_${i}_retained`] === 1).length;
    retention.months.push({
      month: i,
      retained,
      percentage: Math.round((retained / totalCustomers) * 100)
    });
  }
  
  return retention;
}

export function generateMonthlyCohorts(db, storeId) {
  const customers = db.prepare(`
    SELECT * FROM customers WHERE store_id = ? AND first_order_date IS NOT NULL
    ORDER BY first_order_date
  `).all(storeId);
  
  const cohorts = {};
  
  customers.forEach(customer => {
    const orderDate = new Date(customer.first_order_date);
    const cohortKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!cohorts[cohortKey]) {
      cohorts[cohortKey] = [];
    }
    cohorts[cohortKey].push(customer);
  });
  
  return cohorts;
}
