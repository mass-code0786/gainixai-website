const express = require('express');
const router = express.Router();
const {
    getReferralSummary,
    getDownlines,
    getCommissionHistory,
    getReferralStats
} = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.get('/summary', protect, getReferralSummary);
router.get('/downlines', protect, getDownlines);
router.get('/commissions', protect, getCommissionHistory);
router.get('/stats', protect, getReferralStats);

module.exports = router;