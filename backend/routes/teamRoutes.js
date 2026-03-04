const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTeamByLevel, getLevel1To5 } = require('../controllers/teamController');

router.get('/level/:level', protect, getTeamByLevel);
router.get('/tabs/:level', protect, getLevel1To5);

module.exports = router;