const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const {
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    processWithdrawal
} = require('../controllers/withdrawalController');

// User routes
router.post('/create', protect, createWithdrawal);
router.get('/my-withdrawals', protect, getUserWithdrawals);

// Admin routes
router.get('/admin/all', adminProtect, getAllWithdrawals);
router.put('/admin/process/:id', adminProtect, processWithdrawal);

module.exports = router;