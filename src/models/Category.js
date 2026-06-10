const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '💰'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1'
  },
  type: {
    type: DataTypes.ENUM('expense', 'income', 'both'),
    defaultValue: 'expense'
  }
}, {
  tableName: 'categories',
  timestamps: false // categories don't need timestamps
});

// Seed default categories — called once on startup
Category.seedDefaults = async () => {
  const defaults = [
    { name: 'Food & Dining',     icon: '🍔', color: '#f97316', type: 'expense' },
    { name: 'Transport',         icon: '🚗', color: '#3b82f6', type: 'expense' },
    { name: 'Shopping',          icon: '🛍️', color: '#ec4899', type: 'expense' },
    { name: 'Bills & Utilities', icon: '⚡', color: '#eab308', type: 'expense' },
    { name: 'Entertainment',     icon: '🎬', color: '#8b5cf6', type: 'expense' },
    { name: 'Health',            icon: '🏥', color: '#ef4444', type: 'expense' },
    { name: 'Education',         icon: '📚', color: '#06b6d4', type: 'expense' },
    { name: 'Travel',            icon: '✈️', color: '#14b8a6', type: 'expense' },
    { name: 'Salary',            icon: '💼', color: '#22c55e', type: 'income' },
    { name: 'Freelance',         icon: '💻', color: '#10b981', type: 'income' },
    { name: 'Investment',        icon: '📈', color: '#6366f1', type: 'income' },
    { name: 'Other',             icon: '📦', color: '#94a3b8', type: 'both'   }
  ];

  for (const cat of defaults) {
    await Category.findOrCreate({
      where: { name: cat.name },
      defaults: cat
    });
  }
  console.log('Default categories seeded ✅');
};

module.exports = Category;