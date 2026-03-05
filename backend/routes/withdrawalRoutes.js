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
// CONSOLE LOG TO CONFIRM FILE LOADING
// ============================================
console.log('🚀🚀🚀 withdrawalRoutes.js LOADED!');

// ============================================
// TEST ROUTE - TO CHECK IF ROUTES ARE WORKING
// ============================================
router.get('/test', (req, res) => {
    console.log('✅ Test route hit successfully');
    res.json({ 
        success: true, 
        message: 'Test route working',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// USER ROUTES (require authentication)
// ============================================

// Create new withdrawal request
router.post('/create', protect, createWithdrawal);

// Get logged-in user's withdrawal history
router.get('/my-withdrawals', protect, getUserWithdrawals);

// ============================================
// ADMIN ROUTES (require admin authentication)
// ============================================

// Get all withdrawals (with optional status filter)
router.get('/admin/all', adminProtect, getAllWithdrawals);

// Process withdrawal (approve/reject/paid)
router.put('/admin/process/:id', adminProtect, processWithdrawal);

// Get withdrawal statistics (counts, total amounts)
router.get('/admin/stats', adminProtect, getWithdrawalStats);

// ============================================
// EXPORT ROUTER
// ============================================
module.exports = router;