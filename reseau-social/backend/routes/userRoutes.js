const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserSuggestions, followUser, unfollowUser, getUserProfile } = require('../controllers/userController');

const router = express.Router();

// Routes publiques
router.route('/:id').get(getUserProfile);

// Routes protégées
router.use(protect);
router.route('/suggestions').get(getUserSuggestions);
router.route('/:id/follow').post(followUser);
router.route('/:id/unfollow').post(unfollowUser);

module.exports = router;