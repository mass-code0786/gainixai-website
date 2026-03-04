const express = require('express');
const router = express.Router();
const {
    getLevelIncomeSummary,
    getTeamByLevel,
    getLevelIncomeHistory,
    distributeLevelIncome
} = require('../controllers/levelController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.get('/summary', protect, getLevelIncomeSummary);
router.get('/history', protect, getLevelIncomeHistory);
router.get('/team/:level', protect, getTeamByLevel);

// Admin only route
router.post('/distribute', protect, distributeLevelIncome);

module.exports = router;