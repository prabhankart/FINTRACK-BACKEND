const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  type: {
    type: DataTypes.ENUM('savings', 'current', 'credit', 'wallet'),
    allowNull: false
  },

  opening_balance: {
    type: DataTypes.DECIMAL(12,2),
    defaultValue: 0
  },

 balance: {
  type: DataTypes.DECIMAL(12,2),
  defaultValue: 0
},

  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'accounts',
  timestamps: true
});

module.exports = Account;