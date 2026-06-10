const { Transaction, Account, Category, sequelize } = require('../models/index');
const { QueryTypes, Op } = require('sequelize');
const transactionParser = require('./TransactionParser');
const aiCategorizor = require('./AICategorizor');
const fs = require('fs');

class TransactionService {

  // ─── UPLOAD & PROCESS FILE ───────────────────────────────────
  async processUpload(accountId, userId, filePath, mimetype) {
    // Verify account belongs to user
    const account = await Account.findOne({
      where: { id: accountId, user_id: userId }
    });
    if (!account) {
      const error = new Error('Account not found');
      error.status = 404;
      throw error;
    }

    // Parse file — CSV, XLSX or PDF
    const rows = await transactionParser.parseFile(filePath, mimetype);

    if (rows.length === 0) {
      throw new Error('No valid transactions found in file');
    }

    // Process each row with AI categorization
    const transactions = [];
    for (const row of rows) {
      const { category, confidence } = await aiCategorizor.categorize(row.description);

      // Find category id from DB
      const categoryRecord = await Category.findOne({
        where: { name: category }
      });

      transactions.push({
        account_id: accountId,
        category_id: categoryRecord ? categoryRecord.id : null,
        description: row.description,
        amount: row.amount,
        type: row.type,
        date: row.date,
        ai_category: category,
        ai_confidence: confidence
      });
    }

    // Bulk insert — much faster than one by one
    const created = await Transaction.bulkCreate(transactions);

    // Update account balance
    await this.recalculateBalance(accountId);

    // Delete uploaded file after processing
    fs.unlinkSync(filePath);

    return {
      total: created.length,
      transactions: created
    };
  }

async recalculateBalance(accountId) {

  const account = await Account.findByPk(accountId);

  const result = await sequelize.query(`
    SELECT
      COALESCE(
        SUM(
          CASE
            WHEN type='credit'
            THEN amount
            ELSE -amount
          END
        ),
        0
      ) AS transaction_balance
    FROM transactions
    WHERE account_id = :accountId
  `, {
    replacements: { accountId },
    type: QueryTypes.SELECT
  });

  const transactionBalance =
    parseFloat(result[0].transaction_balance || 0);

  const openingBalance =
    parseFloat(account.opening_balance || 0);

  const finalBalance =
    openingBalance + transactionBalance;

  await Account.update(
    {
      balance: finalBalance
    },
    {
      where: { id: accountId }
    }
  );
}

  // ─── GET TRANSACTIONS ─────────────────────────────────────────
  async getTransactions(userId, filters = {}) {
    const { accountId, month, year, type, categoryId, page = 1, limit = 20 } = filters;

    let whereClause = {};
    let accountWhere = { user_id: userId };

    if (accountId) accountWhere.id = accountId;
    if (type) whereClause.type = type;
    if (categoryId) whereClause.category_id = categoryId;
    if (month && year && !isNaN(month) && !isNaN(year)) {
  const m = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate(); // correct last day
  whereClause.date = {
    [Op.between]: [
      `${year}-${m}-01`,
      `${year}-${m}-${lastDay}`
    ]
  };
}

    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { model: Account, where: accountWhere, attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name', 'icon', 'color'] }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return {
      transactions: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  // ─── ANALYTICS WITH WINDOW FUNCTIONS ─────────────────────────
  async getAnalytics(userId, month, year) {
    const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();
  month = m;
  year = y;
    // 1. Running balance — Window Function
    const runningBalance = await sequelize.query(`
      SELECT 
        t.date,
        t.description,
        t.amount,
        t.type,
        SUM(
          CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END
        ) OVER (
          PARTITION BY t.account_id
          ORDER BY t.date, t.id
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_balance
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = :userId
        AND EXTRACT(MONTH FROM t.date) = :month
        AND EXTRACT(YEAR FROM t.date) = :year
      ORDER BY t.date
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
    });

    // 2. Spending by category — with RANK window function
    const categorySpending = await sequelize.query(`
      SELECT 
        c.name as category,
        c.icon,
        c.color,
        SUM(t.amount) as total,
        RANK() OVER (ORDER BY SUM(t.amount) DESC) as rank
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      JOIN categories c ON c.id = t.category_id
      WHERE a.user_id = :userId
        AND t.type = 'debit'
        AND EXTRACT(MONTH FROM t.date) = :month
        AND EXTRACT(YEAR FROM t.date) = :year
      GROUP BY c.name, c.icon, c.color
      ORDER BY total DESC
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
    });

    // 3. Month over month comparison — LAG window function
    const monthlyTrend = await sequelize.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', t.date), 'Mon YYYY') as month,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as expenses,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as income,
        LAG(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END))
          OVER (ORDER BY DATE_TRUNC('month', t.date)) as prev_month_expenses
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = :userId
      GROUP BY DATE_TRUNC('month', t.date)
      ORDER BY DATE_TRUNC('month', t.date)
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    // 4. Income vs Expense summary
    const summary = await sequelize.query(`
      SELECT
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END) as net_savings
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE a.user_id = :userId
        AND EXTRACT(MONTH FROM t.date) = :month
        AND EXTRACT(YEAR FROM t.date) = :year
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
    });

    return {
      runningBalance,
      categorySpending,
      monthlyTrend,
      summary: summary[0]
    };
  }

  // ─── ADD MANUAL TRANSACTION ───────────────────────────────────
  async addTransaction(userId, data) {
    const account = await Account.findOne({
      where: { id: data.account_id, user_id: userId }
    });
    if (!account) {
      const error = new Error('Account not found');
      error.status = 404;
      throw error;
    }

    const { category, confidence } = await aiCategorizor.categorize(data.description);
    const categoryRecord = await Category.findOne({ where: { name: category } });

    const transaction = await Transaction.create({
      ...data,
      category_id: data.category_id || (categoryRecord ? categoryRecord.id : null),
      ai_category: category,
      ai_confidence: confidence
    });

    await this.recalculateBalance(data.account_id);
    return transaction;
  }

  // Delete transaction
  async deleteTransaction(transactionId, userId) {
    const transaction = await Transaction.findOne({
      include: [{ model: Account, where: { user_id: userId } }],
      where: { id: transactionId }
    });

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.status = 404;
      throw error;
    }

    const accountId = transaction.account_id;
    await transaction.destroy();
    await this.recalculateBalance(accountId);
    return { message: 'Transaction deleted' };
  }
}

module.exports = new TransactionService();