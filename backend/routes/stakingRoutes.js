const express = require('express');
const router = express.Router();
const { 
    createStaking, 
    getActiveStakings, 
    unstakeStaking,
    getStakingStats 
} = require('../controllers/stakingController');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createStaking);
router.get('/active', protect, getActiveStakings);
router.get('/stats', protect, getStakingStats);
router.post('/unstake/:id', protect, unstakeStaking);

module.exports = router;