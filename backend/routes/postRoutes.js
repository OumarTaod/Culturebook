const express = require('express');
const {
  creerPost,
  getPosts,
  likerPost,
  ajouterCommentaire,
  getCommentaires
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
    .get(getPosts)
    .post(protect, upload.single('media'), creerPost);

router.route('/:id/vote')
    .patch(protect, likerPost);

router.route('/:id/comments')
    .get(getCommentaires)
    .post(protect, ajouterCommentaire);

module.exports = router;
