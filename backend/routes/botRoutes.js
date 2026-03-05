const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const {
    getBotSettings,
    updateBotSettings,
    resetBotStats,
    getBotStats
} = require('../controllers/botController');

// Public routes
router.get('/stats', getBotStats);
router.get('/settings', getBotSettings);

// Admin only routes
router.put('/settings', adminProtect, updateBotSettings);
router.post('/reset-stats', adminProtect, resetBotStats);

module.exports = router;