const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
    adminLogin,
    getDashboardStats,
    getUsers,
    getUserDetails,
    getWithdrawals,
    processWithdrawal,
    createAdmin
} = require('../controllers/adminController');

// Public route
router.post('/login', adminLogin);

// Protected routes (require admin auth)
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/users', adminProtect, getUsers);
router.get('/users/:userId', adminProtect, getUserDetails);
router.get('/withdrawals', adminProtect, getWithdrawals);
router.put('/withdrawals/:withdrawalId', adminProtect, processWithdrawal);

// Superadmin only
router.post('/create', adminProtect, createAdmin); // Add check for superadmin

module.exports = router;