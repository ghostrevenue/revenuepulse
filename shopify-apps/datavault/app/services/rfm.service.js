import * as customerModel from '../customer.js';

export function calculateRfmScores(db, storeId) {
  const customers = customerModel.getCustomers(db, storeId, { limit: 10000 });
  const now = new Date();
  
  // Calculate RFM for each customer
  const rfmData = customers.map(customer => {
    const lastOrderDate = customer.last_order_date ? new Date(customer.last_order_date) : null;
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24)) 
      : 999;
    
    // R: Recency score (1-5, higher is better - fewer days is better)
    let rScore = 1;
    if (daysSinceLastOrder <= 7) rScore = 5;
    else if (daysSinceLastOrder <= 14) rScore = 4;
    else if (daysSinceLastOrder <= 30) rScore = 3;
    else if (daysSinceLastOrder <= 60) rScore = 2;
    
    // F: Frequency score (1-5, higher is better)
    let fScore = 1;
    if (customer.total_orders >= 10) fScore = 5;
    else if (customer.total_orders >= 5) fScore = 4;
    else if (customer.total_orders >= 3) fScore = 3;
    else if (customer.total_orders >= 2) fScore = 2;
    
    // M: Monetary score (1-5, higher is better)
    let mScore = 1;
    if (customer.total_spent >= 1000) mScore = 5;
    else if (customer.total_spent >= 500) mScore = 4;
    else if (customer.total_spent >= 200) mScore = 3;
    else if (customer.total_spent >= 100) mScore = 2;
    
    const rfmScore = rScore * 100 + fScore * 10 + mScore;
    
    // Update customer record
    customerModel.updateRfmScore(db, storeId, customer.id, rfmScore);
    
    return {
      customer_id: customer.id,
      email: customer.email,
      rfm_score: rfmScore,
      r: rScore,
      f: fScore,
      m: mScore,
      recency_days: daysSinceLastOrder,
      frequency: customer.total_orders,
      monetary: customer.total_spent
    };
  });
  
  return rfmData;
}

export function getRfmMatrix(db, storeId) {
  const rfmData = calculateRfmScores(db, storeId);
  
  // Build matrix: rows = R score, cols = F score, cells = count by M
  const matrix = {};
  const distribution = { r: {}, f: {}, m: {} };
  
  rfmData.forEach(d => {
    const key = `${d.r}${d.f}${d.m}`;
    matrix[key] = (matrix[key] || 0) + 1;
    
    distribution.r[d.r] = (distribution.r[d.r] || 0) + 1;
    distribution.f[d.f] = (distribution.f[d.f] || 0) + 1;
    distribution.m[d.m] = (distribution.m[d.m] || 0) + 1;
  });
  
  // Segment breakdown
  const segments = {
    champions: rfmData.filter(d => d.r >= 4 && d.f >= 4 && d.m >= 4).length,
    loyal: rfmData.filter(d => d.f >= 3 && d.m >= 3).length,
    potential: rfmData.filter(d => d.r >= 3 && d.f <= 2).length,
    atRisk: rfmData.filter(d => d.r <= 2 && (d.f >= 2 || d.m >= 2)).length,
    lost: rfmData.filter(d => d.r <= 2 && d.f <= 2 && d.m <= 2).length
  };
  
  return {
    matrix,
    distribution,
    segments,
    total: rfmData.length
  };
}

export function getRfmCustomers(db, storeId, r, f, m) {
  const rfmData = calculateRfmScores(db, storeId);
  return rfmData.filter(d => d.r === r && d.f === f && d.m === m);
}
