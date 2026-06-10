const sequelize = require('../config/database');
const User = require('./User');
const Account = require('./Account');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./Budget');

// ============================================
// ASSOCIATIONS — DBMS Foreign Key Relationships
// ============================================

// User has many Accounts
User.hasMany(Account, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'user_id' });

// Account has many Transactions
Account.hasMany(Transaction, { foreignKey: 'account_id', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'account_id' });

// Category has many Transactions
Category.hasMany(Transaction, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Transaction.belongsTo(Category, { foreignKey: 'category_id' });

// User has many Budgets
User.hasMany(Budget, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'user_id' });

// Category has many Budgets
Category.hasMany(Budget, { foreignKey: 'category_id', onDelete: 'CASCADE' });
Budget.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = {
  sequelize,
  User,
  Account,
  Category,
  Transaction,
  Budget
};