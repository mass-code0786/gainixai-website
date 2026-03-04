const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendP2P, getP2PHistory } = require('../controllers/p2pController');

router.post('/send', protect, sendP2P);
router.get('/history', protect, getP2PHistory);

module.exports = router;