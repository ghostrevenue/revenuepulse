export const PredictionService = {
  calculateDaysUntilOut(product, weeklyVelocity) {
    if (weeklyVelocity <= 0) return Infinity;
    return Math.floor((product.quantity / weeklyVelocity) * 7);
  },
  
  getSuggestedReorderDate(product, weeklyVelocity) {
    const daysUntilOut = this.calculateDaysUntilOut(product, weeklyVelocity);
    const leadTimeDays = product.lead_time_days || 7;
    const daysUntilReorder = daysUntilOut - leadTimeDays;
    
    if (daysUntilReorder <= 0) return new Date().toISOString();
    return new Date(Date.now() + daysUntilReorder * 86400000).toISOString();
  },
  
  getReorderQuantity(product, weeklyVelocity) {
    const leadTimeDays = product.lead_time_days || 7;
    const safetyStock = Math.ceil((weeklyVelocity / 7) * 3);
    return Math.ceil((weeklyVelocity / 7) * (leadTimeDays + 7)) + safetyStock;
  }
};