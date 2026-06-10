const dotenv = require('dotenv');
dotenv.config();

// NOW check
console.log('HF Token loaded:', process.env.HF_TOKEN ? 'YES ✅' : 'NO ❌');
require('express-async-errors');
const express = require('express');
const cors = require('cors');

const { sequelize } = require('./src/models/index');



const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // React Vite default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (we add these one by one)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/accounts', require('./src/routes/accountRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/budgets', require('./src/routes/budgetRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'FinTrack API running ✅' });
});

// Error middleware (always last)
app.use(require('./src/middleware/errorMiddleware'));

const PORT = process.env.PORT || 5000;

// Connect DB then start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected ✅');

    // Sync all models to DB
  await sequelize.sync({ alter: true });
console.log('All models synced ✅');

// Seed default categories
const { Category } = require('./src/models/index');
await Category.seedDefaults();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} ✅`);
    });
  } catch (error) {
    console.error('Server failed to start ❌', error);
    process.exit(1);
  }
};

startServer();