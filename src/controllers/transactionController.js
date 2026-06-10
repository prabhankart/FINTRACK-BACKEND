const transactionService = require('../services/TransactionService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const uploadTransactions = async (req, res) => {
  if (!req.file) return sendError(res, 'Please upload a file', 400);
  if (!req.body.account_id) return sendError(res, 'Account ID is required', 400);

  const result = await transactionService.processUpload(
    req.body.account_id,
    req.user.id,
    req.file.path,
    req.file.mimetype
  );

  return sendSuccess(res, result, `${result.total} transactions imported successfully`, 201);
};

const getTransactions = async (req, res) => {
  const result = await transactionService.getTransactions(req.user.id, req.query);
  return sendSuccess(res, result);
};
const getAnalytics = async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const analytics = await transactionService.getAnalytics(req.user.id, month, year);
  return sendSuccess(res, analytics);
};
const addTransaction = async (req, res) => {
  const transaction = await transactionService.addTransaction(req.user.id, req.body);
  return sendSuccess(res, { transaction }, 'Transaction added', 201);
};

const deleteTransaction = async (req, res) => {
  const result = await transactionService.deleteTransaction(req.params.id, req.user.id);
  return sendSuccess(res, result);
};

module.exports = {
  uploadTransactions,
  getTransactions,
  getAnalytics,
  addTransaction,
  deleteTransaction
};