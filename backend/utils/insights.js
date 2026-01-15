// Generate plain-English weekly insights

export function generateWeeklyInsights(expenses, budgets, totalSpent, totalBudget) {
  const insights = [];
  
  // Calculate spending by category
  const categorySpending = {};
  expenses.forEach(expense => {
    categorySpending[expense.category] = (categorySpending[expense.category] || 0) + expense.amount;
  });
  
  // Top spending category
  const topCategory = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (topCategory) {
    insights.push({
      type: 'top_category',
      message: `You spent the most on ${topCategory[0]} this week - $${topCategory[1].toFixed(2)}.`
    });
  }
  
  // Budget status
  const budgetPacing = (totalSpent / totalBudget) * 100;
  if (budgetPacing > 100) {
    insights.push({
      type: 'over_budget',
      message: `You're ${budgetPacing.toFixed(0)}% over budget this week. Consider cutting back on non-essentials.`
    });
  } else if (budgetPacing > 80) {
    insights.push({
      type: 'warning',
      message: `You've used ${budgetPacing.toFixed(0)}% of your budget. Watch your spending for the rest of the week.`
    });
  } else {
    insights.push({
      type: 'on_track',
      message: `You're doing great! You've used ${budgetPacing.toFixed(0)}% of your budget and still have $${(totalBudget - totalSpent).toFixed(2)} left.`
    });
  }
  
  // Spending pattern
  const avgDailySpending = totalSpent / 7;
  insights.push({
    type: 'pattern',
    message: `You're averaging $${avgDailySpending.toFixed(2)} per day this week.`
  });
  
  // Category comparison
  if (budgets.length > 0) {
    budgets.forEach(budget => {
      const spent = categorySpending[budget.category] || 0;
      const percentage = (spent / budget.amount) * 100;
      if (percentage > 100) {
        insights.push({
          type: 'category_over',
          message: `Your ${budget.category} spending is ${percentage.toFixed(0)}% over budget.`
        });
      }
    });
  }
  
  return insights;
}
