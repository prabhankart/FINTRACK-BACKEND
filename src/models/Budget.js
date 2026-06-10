const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categories', key: 'id' }
  },
  limit_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Budget limit must be greater than 0' }
    }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  alert_at_percent: {
    type: DataTypes.INTEGER,
    defaultValue: 80  // alert when 80% of budget used
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['category_id'] },
    // Unique constraint — one budget per category per month per user
    {
      unique: true,
      fields: ['user_id', 'category_id', 'month', 'year']
    }
  ]
});

module.exports = Budget;