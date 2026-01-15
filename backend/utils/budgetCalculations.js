// Budget pacing and safe-to-spend calculations

export function calculateBudgetPacing(totalBudget, spent, period = 'weekly') {
  const now = new Date();
  let daysElapsed, daysTotal;
  
  if (period === 'weekly') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    daysElapsed = Math.floor((now - startOfWeek) / (1000 * 60 * 60 * 24)) + 1;
    daysTotal = 7;
  } else {
    // Monthly
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    daysElapsed = Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24)) + 1;
    daysTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }
  
  const expectedSpent = (totalBudget / daysTotal) * daysElapsed;
  const safeToSpend = totalBudget - spent;
  const pacing = (spent / expectedSpent) * 100;
  const remainingDays = daysTotal - daysElapsed;
  const dailyAllowance = remainingDays > 0 ? safeToSpend / remainingDays : 0;
  
  return {
    totalBudget,
    spent,
    safeToSpend: Math.max(0, safeToSpend),
    expectedSpent,
    pacing: Math.round(pacing * 10) / 10,
    daysElapsed,
    daysTotal,
    remainingDays,
    dailyAllowance: Math.max(0, dailyAllowance),
    isOnTrack: pacing <= 100
  };
}

export function isUnderBudget(totalBudget, spent) {
  return spent <= totalBudget;
}
