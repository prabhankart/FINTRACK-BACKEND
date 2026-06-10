// SOLID — Single Responsibility
// ONLY job: analyze spending vs budget

class BudgetAnalyzer {

  analyze(spent, limit) {
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    if (percentage >= 100) {
      return {
        status: 'exceeded',
        color: 'red',
        percentage: Math.round(percentage),
        message: `Budget exceeded by ₹${(spent - limit).toFixed(2)}`
      };
    }

    if (percentage >= 80) {
      return {
        status: 'warning',
        color: 'yellow',
        percentage: Math.round(percentage),
        message: `${Math.round(percentage)}% of budget used — running low!`
      };
    }

    return {
      status: 'safe',
      color: 'green',
      percentage: Math.round(percentage),
      message: `₹${(limit - spent).toFixed(2)} remaining`
    };
  }

  analyzeAll(budgets, spendingMap) {
    return budgets.map(budget => ({
      ...budget.toJSON(),
      spent: spendingMap[budget.category_id] || 0,
      analysis: this.analyze(
        spendingMap[budget.category_id] || 0,
        budget.limit_amount
      )
    }));
  }
}

module.exports = new BudgetAnalyzer();