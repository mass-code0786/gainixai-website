console.log('🚀🚀🚀 withdrawalRoutes.js LOADED!');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const {
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    processWithdrawal,
    getWithdrawalStats
} = require('../controllers/withdrawalController');

// ============================================
// USER ROUTES
// ============================================
router.post('/create', protect, createWithdrawal);
router.get('/my-withdrawals', protect, getUserWithdrawals);
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Test route working' });
});

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/admin/all', adminProtect, getAllWithdrawals);
router.put('/admin/process/:id', adminProtect, processWithdrawal);
router.get('/admin/stats', adminProtect, getWithdrawalStats);

module.exports = router;