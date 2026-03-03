const express = require('express');
const router = express.Router();
const {
    getAllRanks,
    getMyRank,
    checkRankEligibility,
    distributeWeeklySalary,
    getSalaryHistory
} = require('../controllers/salaryController');
const { protect } = require('../middleware/auth');

router.get('/ranks', getAllRanks);
router.get('/my-rank', protect, getMyRank);
router.get('/history', protect, getSalaryHistory);
router.post('/check-rank', protect, checkRankEligibility);
router.post('/distribute', protect, distributeWeeklySalary); // Admin only

module.exports = router;