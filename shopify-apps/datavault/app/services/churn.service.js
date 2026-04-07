import * as customerModel from '../customer.js';

export function calculateChurnScores(db, storeId) {
  const customers = customerModel.getCustomers(db, storeId, { limit: 10000 });
  const now = new Date();
  
  // Calculate average metrics for the store
  const avgOrders = customers.reduce((sum, c) => sum + c.total_orders, 0) / (customers.length || 1);
  const avgDaysBetweenOrders = 30; // Default assumption
  
  const churnData = customers.map(customer => {
    const lastOrderDate = customer.last_order_date ? new Date(customer.last_order_date) : null;
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24)) 
      : 999;
    
    // Calculate expected order frequency
    let churnScore = 0;
    
    // Factor 1: Days since last order (max 40 points)
    if (daysSinceLastOrder > 90) churnScore += 40;
    else if (daysSinceLastOrder > 60) churnScore += 30;
    else if (daysSinceLastOrder > 30) churnScore += 20;
    else if (daysSinceLastOrder > 14) churnScore += 10;
    
    // Factor 2: Declining order frequency (max 30 points)
    if (customer.total_orders >= 2) {
      // If only 1-2 orders total and long gap, high risk
      if (customer.total_orders <= 2 && daysSinceLastOrder > 21) {
        churnScore += 30;
      }
    }
    
    // Factor 3: Low lifetime value but many orders (max 20 points)
    if (customer.total_orders >= 3 && customer.avg_order_value < 30) {
      churnScore += 20;
    }
    
    // Factor 4: Tags indicate risk (max 10 points)
    const tags = JSON.parse(customer.tags || '[]');
    if (tags.includes('churned') || tags.includes('inactive')) {
      churnScore += 10;
    }
    
    churnScore = Math.min(100, churnScore);
    
    // Update customer record
    customerModel.updateChurnScore(db, storeId, customer.id, churnScore);
    
    return {
      customer_id: customer.id,
      email: customer.email,
      churn_score: churnScore,
      risk_level: churnScore >= 70 ? 'high' : churnScore >= 40 ? 'medium' : 'low',
      days_since_last_order: daysSinceLastOrder,
      total_orders: customer.total_orders,
      avg_order_value: customer.avg_order_value
    };
  });
  
  return churnData;
}

export function getChurnDistribution(db, storeId) {
  const churnData = calculateChurnScores(db, storeId);
  
  const distribution = {
    high: { count: 0, percentage: 0 },
    medium: { count: 0, percentage: 0 },
    low: { count: 0, percentage: 0 }
  };
  
  churnData.forEach(d => {
    if (d.risk_level === 'high') distribution.high.count++;
    else if (d.risk_level === 'medium') distribution.medium.count++;
    else distribution.low.count++;
  });
  
  const total = churnData.length || 1;
  distribution.high.percentage = Math.round((distribution.high.count / total) * 100);
  distribution.medium.percentage = Math.round((distribution.medium.count / total) * 100);
  distribution.low.percentage = Math.round((distribution.low.count / total) * 100);
  
  return distribution;
}

export function getAtRiskCustomers(db, storeId) {
  const churnData = calculateChurnScores(db, storeId);
  return churnData.filter(d => d.risk_level === 'high').sort((a, b) => b.churn_score - a.churn_score);
}

export function getChurnSummary(db, storeId) {
  const distribution = getChurnDistribution(db, storeId);
  
  return {
    highRisk: distribution.high.count,
    mediumRisk: distribution.medium.count,
    lowRisk: distribution.low.count,
    highRiskPercentage: distribution.high.percentage,
    recoveryRate: distribution.low.percentage
  };
}
