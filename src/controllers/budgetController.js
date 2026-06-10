const budgetService = require('../services/BudgetService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const createBudget = async (req, res) => {
  const budget = await budgetService.createBudget(req.user.id, req.body);
  return sendSuccess(res, { budget }, 'Budget created', 201);
};

const getBudgets = async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const budgets = await budgetService.getBudgets(req.user.id, month, year);
  return sendSuccess(res, { budgets });
};

const getBudgetOverview = async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const overview = await budgetService.getBudgetOverview(req.user.id, month, year);
  return sendSuccess(res, { overview });
};

const updateBudget = async (req, res) => {
  const budget = await budgetService.updateBudget(
    req.params.id, req.user.id, req.body
  );
  return sendSuccess(res, { budget }, 'Budget updated');
};

const deleteBudget = async (req, res) => {
  const result = await budgetService.deleteBudget(req.params.id, req.user.id);
  return sendSuccess(res, result);
};



module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetOverview
};