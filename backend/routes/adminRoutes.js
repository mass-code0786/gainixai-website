const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
    adminLogin,
    getDashboardStats,
    getUsers,
    getUserDetails,
    updateUser,
    getWithdrawals,
    processWithdrawal,
    getStakings,
    getUnstakeRequests,
    processUnstake,
    getTransactions,
    createAdmin,
    walletTransfer,
    addStaking
} = require('../controllers/adminController');

// Public route
router.post('/login', adminLogin);

// Protected routes
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/users', adminProtect, getUsers);
router.get('/users/:userId', adminProtect, getUserDetails);
router.put('/users/:userId', adminProtect, updateUser);
router.get('/withdrawals', adminProtect, getWithdrawals);
router.put('/withdrawals/:withdrawalId', adminProtect, processWithdrawal);
router.get('/stakings', adminProtect, getStakings);
router.get('/unstake-requests', adminProtect, getUnstakeRequests);
router.put('/unstake/:unstakeId', adminProtect, processUnstake);
router.get('/transactions', adminProtect, getTransactions);
router.post('/wallet-transfer', adminProtect, walletTransfer);
router.post('/add-staking', adminProtect, addStaking);

// Superadmin only
router.post('/create', adminProtect, createAdmin);

module.exports = router;