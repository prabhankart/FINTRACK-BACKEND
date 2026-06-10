const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'accounts', key: 'id' }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'categories', key: 'id' }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Description is required' }
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Amount must be greater than 0' }
    }
  },
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ai_category: {
    type: DataTypes.STRING,
    defaultValue: null  // what AI suggested
  },
  ai_confidence: {
    type: DataTypes.FLOAT,
    defaultValue: null  // AI confidence score 0-1
  },
  note: {
    type: DataTypes.TEXT,
    defaultValue: null
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    // DBMS concept — indexes for fast queries
    { fields: ['account_id'] },
    { fields: ['category_id'] },
    { fields: ['date'] },
    { fields: ['type'] }
  ]
});

module.exports = Transaction;