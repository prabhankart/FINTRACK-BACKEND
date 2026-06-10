const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const {
  uploadTransactions,
  getTransactions,
  getAnalytics,
  addTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

router.use(protect);

router.post('/upload', upload.single('file'), uploadTransactions);
router.get('/', getTransactions);
router.get('/analytics', getAnalytics);
router.post('/', addTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;