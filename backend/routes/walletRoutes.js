const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    depositFunds,
    getWalletBalances
} = require('../controllers/walletController');

router.post('/deposit', protect, depositFunds);
router.get('/balances', protect, getWalletBalances);

module.exports = router;