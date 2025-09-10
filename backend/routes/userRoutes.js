const express = require('express');
const { getUserById, getUserPosts, updateUser, getSuggestions, followUser, unfollowUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/suggestions', protect, getSuggestions);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);

router.get('/:id', getUserById);
router.get('/:id/posts', getUserPosts);
router.patch('/:id', protect, upload.single('avatar'), updateUser);

module.exports = router;
