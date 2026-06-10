const { Account, Transaction, sequelize } = require('../models/index');
const { QueryTypes } = require('sequelize');

class AccountService {

  // Create new account
  async createAccount(userId, data) {
    const account = await Account.create({
      user_id: userId,
      name: data.name,
      type: data.type,
      balance: data.balance || 0,
      currency: data.currency || 'INR'
    });
    return account;
  }

  // Get all accounts for a user
  async getUserAccounts(userId) {
    const accounts = await Account.findAll({
      where: { user_id: userId, is_active: true },
      order: [['createdAt', 'DESC']]
    });
    return accounts;
  }

  // Get single account
  async getAccount(accountId, userId) {
    const account = await Account.findOne({
      where: { id: accountId, user_id: userId }
    });
    if (!account) {
      const error = new Error('Account not found');
      error.status = 404;
      throw error;
    }
    return account;
  }

  // Update account
  async updateAccount(accountId, userId, data) {
    const account = await this.getAccount(accountId, userId);
    await account.update(data);
    return account;
  }

  // Delete account (soft delete)
  async deleteAccount(accountId, userId) {
    const account = await this.getAccount(accountId, userId);
    await account.update({ is_active: false });
    return { message: 'Account deleted successfully' };
  }

  // Get account summary with total balance
  async getAccountSummary(userId) {
    // Raw SQL query with aggregation — DBMS concept
    const summary = await sequelize.query(`
      SELECT 
        COUNT(a.id) as total_accounts,
        SUM(a.balance) as total_balance,
        SUM(CASE WHEN a.type = 'savings' THEN a.balance ELSE 0 END) as savings_balance,
        SUM(CASE WHEN a.type = 'current' THEN a.balance ELSE 0 END) as current_balance,
        SUM(CASE WHEN a.type = 'credit' THEN a.balance ELSE 0 END) as credit_balance
      FROM accounts a
      WHERE a.user_id = :userId AND a.is_active = true
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });
    return summary[0];
  }
}

module.exports = new AccountService();