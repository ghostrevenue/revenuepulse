import * as cohortModel from '../cohort.js';

export function getAllCohortGroups(db, storeId) {
  return cohortModel.getCohortGroups(db, storeId);
}

export function getCohortGroup(db, storeId, cohortId) {
  return cohortModel.getCohortGroupById(db, storeId, cohortId);
}

export function createCohortGroup(db, storeId, name, startDate, endDate) {
  return cohortModel.createCohortGroup(db, storeId, name, startDate, endDate);
}

export function getCohortAnalysis(db, storeId, cohortId) {
  return cohortModel.calculateCohortRetention(db, storeId, cohortId);
}

export function generateCohorts(db, storeId) {
  return cohortModel.generateMonthlyCohorts(db, storeId);
}

export function buildCohortReport(db, storeId) {
  const cohorts = cohortModel.generateMonthlyCohorts(db, storeId);
  const report = [];
  
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  
  Object.entries(cohorts).forEach(([cohortKey, customers]) => {
    const [year, month] = cohortKey.split('-').map(Number);
    const cohortMonth = year * 12 + month;
    const monthsSinceStart = currentMonth - cohortMonth;
    
    const retainedCounts = Array(7).fill(0);
    retainedCounts[0] = customers.length;
    
    customers.forEach(customer => {
      if (customer.last_order_date) {
        const lastOrder = new Date(customer.last_order_date);
        const lastOrderMonth = lastOrder.getFullYear() * 12 + lastOrder.getMonth();
        const monthsActive = lastOrderMonth - cohortMonth;
        
        for (let i = 0; i <= Math.min(monthsActive, 6); i++) {
          retainedCounts[i]++;
        }
      }
    });
    
    report.push({
      cohort: cohortKey,
      size: customers.length,
      retention: retainedCounts.map((count, i) => ({
        month: i,
        count,
        percentage: i === 0 ? 100 : Math.round((count / customers.length) * 100)
      }))
    });
  });
  
  return report.sort((a, b) => b.cohort.localeCompare(a.cohort));
}
