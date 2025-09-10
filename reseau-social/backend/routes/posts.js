const express = require('express');
const { createPost, getPosts } = require('../controllers/postController');
// const { protect } = require('../middleware/authMiddleware'); // À créer pour la protection des routes

const router = express.Router();

// Pour l'instant, on ne met pas la protection pour faciliter les tests.
// Il faudra l'ajouter avec .post(protect, createPost)
router.route('/').get(getPosts).post(createPost);

module.exports = router;