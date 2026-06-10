const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetOverview
} = require('../controllers/budgetController');

router.use(protect);

router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/overview', getBudgetOverview);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;