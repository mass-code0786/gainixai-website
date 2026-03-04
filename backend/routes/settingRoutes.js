const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
    getSettings,
    updateSettings,
    updateStakingPackages,
    updateBotSettings,
    updateWithdrawalSettings,
    updateLevelPercentages,
    toggleMaintenance
} = require('../controllers/settingController');

// Public route (no auth needed)
router.get('/', getSettings);

// Admin only routes
router.put('/', adminProtect, updateSettings);
router.put('/packages', adminProtect, updateStakingPackages);
router.put('/bot', adminProtect, updateBotSettings);
router.put('/withdrawal', adminProtect, updateWithdrawalSettings);
router.put('/levels', adminProtect, updateLevelPercentages);
router.put('/maintenance', adminProtect, toggleMaintenance);

module.exports = router;