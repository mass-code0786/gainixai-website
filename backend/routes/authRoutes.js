const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authControllers');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private route (example - will add auth middleware later)
// router.get('/profile', protect, getUserProfile);

module.exports = router;