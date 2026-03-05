const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    placeTrade,
    getUserTrades,
    getTradeStats
} = require('../controllers/tradeController');

router.post('/place', protect, placeTrade);
router.get('/history', protect, getUserTrades);
router.get('/stats', protect, getTradeStats);

module.exports = router;