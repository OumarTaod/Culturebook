const express = require('express');
const {
  creerPost,
  getPosts,
  toggleLike,
  getCommentaires,
  ajouterCommentaire
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
    .get(getPosts)
    .post(protect, upload.single('media'), creerPost);

router.route('/:id/like')
    .patch(protect, toggleLike);

router.route('/:id/comments')
    .get(getCommentaires)
    .post(protect, ajouterCommentaire);

module.exports = router;
