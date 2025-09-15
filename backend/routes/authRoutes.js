const express = require('express');
const router = express.Router();
const { register, login, profile, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, profile);
router.post('/refresh-token', refreshToken);

module.exports = router;
