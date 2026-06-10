const { Budget, Category, Transaction, Account, sequelize } = require('../models/index');
const { QueryTypes } = require('sequelize');
const budgetAnalyzer = require('./BudgetAnalyzer');

class BudgetService {

  // Create budget
  async createBudget(userId, data) {
    const { category_id, limit_amount, month, year } = data;

    if (!category_id || !limit_amount || !month || !year) {
      const error = new Error('category_id, limit_amount, month and year are required');
      error.status = 400;
      throw error;
    }

    const budget = await Budget.create({
      user_id: userId,
      category_id,
      limit_amount,
      month,
      year,
      alert_at_percent: data.alert_at_percent || 80
    });

    return budget;
  }

  // Get all budgets with spending analysis
  async getBudgets(userId, month, year) {
    // Get all budgets for this month
    const budgets = await Budget.findAll({
      where: { user_id: userId, month, year },
      include: [{ 
        model: Category, 
        attributes: ['id', 'name', 'icon', 'color'] 
      }]
    });

    if (budgets.length === 0) return [];

    // Get actual spending per category this month — SQL aggregation
    const spending = await sequelize.query(`
      SELECT 
        t.category_id,
        SUM(t.amount) as total_spent
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = :userId
        AND t.type = 'debit'
        AND EXTRACT(MONTH FROM t.date) = :month
        AND EXTRACT(YEAR FROM t.date) = :year
      GROUP BY t.category_id
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
    });

    // Build spending map { category_id: total_spent }
    const spendingMap = {};
    spending.forEach(s => {
      spendingMap[s.category_id] = parseFloat(s.total_spent);
    });

    // Analyze each budget using BudgetAnalyzer — SOLID
    return budgetAnalyzer.analyzeAll(budgets, spendingMap);
  }

  // Update budget
  async updateBudget(budgetId, userId, data) {
    const budget = await Budget.findOne({
      where: { id: budgetId, user_id: userId }
    });

    if (!budget) {
      const error = new Error('Budget not found');
      error.status = 404;
      throw error;
    }

    await budget.update(data);
    return budget;
  }

  // Delete budget
  async deleteBudget(budgetId, userId) {
    const budget = await Budget.findOne({
      where: { id: budgetId, user_id: userId }
    });

    if (!budget) {
      const error = new Error('Budget not found');
      error.status = 404;
      throw error;
    }

    await budget.destroy();
    return { message: 'Budget deleted successfully' };
  }

  // Get budget overview — all categories with/without budgets
  async getBudgetOverview(userId, month, year) {
    const result = await sequelize.query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon,
        c.color,
        COALESCE(b.limit_amount, 0) as budget_limit,
        COALESCE(SUM(t.amount), 0) as total_spent,
        CASE 
          WHEN b.limit_amount > 0 
          THEN ROUND((COALESCE(SUM(t.amount), 0) / b.limit_amount) * 100, 1)
          ELSE 0 
        END as percentage_used
      FROM categories c
      LEFT JOIN budgets b 
        ON b.category_id = c.id 
        AND b.user_id = :userId
        AND b.month = :month 
        AND b.year = :year
      LEFT JOIN transactions t 
        ON t.category_id = c.id
        AND t.type = 'debit'
        AND EXTRACT(MONTH FROM t.date) = :month
        AND EXTRACT(YEAR FROM t.date) = :year
      LEFT JOIN accounts a 
        ON a.id = t.account_id 
        AND a.user_id = :userId
      GROUP BY c.id, c.name, c.icon, c.color, b.limit_amount
      ORDER BY total_spent DESC
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
    });

    return result;
  }
}

module.exports = new BudgetService();