const express = require('express');
const router = express.Router();
const {
    getTeamByLevel,
    getLevelIncomeSummary,
    getLevelIncomeHistory,
    distributeLevelIncome
} = require('../controllers/levelController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.get('/summary', protect, getLevelIncomeSummary);
router.get('/history', protect, getLevelIncomeHistory);
router.get('/team/:level', protect, getTeamByLevel);

// Admin only route
router.post('/distribute', protect, distributeLevelIncome); // Add admin check later

module.exports = router;