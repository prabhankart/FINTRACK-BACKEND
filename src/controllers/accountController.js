const accountService = require('../services/AccountService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const createAccount = async (req, res) => {
  const { name, type, balance, currency } = req.body;
  if (!name || !type) return sendError(res, 'Name and type are required', 400);
  const account = await accountService.createAccount(req.user.id, req.body);
  return sendSuccess(res, { account }, 'Account created', 201);
};

const getAccounts = async (req, res) => {
  const accounts = await accountService.getUserAccounts(req.user.id);
  const summary = await accountService.getAccountSummary(req.user.id);
  return sendSuccess(res, { accounts, summary });
};

const getAccount = async (req, res) => {
  const account = await accountService.getAccount(req.params.id, req.user.id);
  return sendSuccess(res, { account });
};

const updateAccount = async (req, res) => {
  const account = await accountService.updateAccount(req.params.id, req.user.id, req.body);
  return sendSuccess(res, { account }, 'Account updated');
};

const deleteAccount = async (req, res) => {
  const result = await accountService.deleteAccount(req.params.id, req.user.id);
  return sendSuccess(res, result);
};

module.exports = { createAccount, getAccounts, getAccount, updateAccount, deleteAccount };