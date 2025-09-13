const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { listUsers, updateUserRole, deleteUser, getStats, listPosts, deletePost } = require('../controllers/adminController');

const router = express.Router();

// Tous ces endpoints nécessitent une authentification
router.use(protect);

// Statistiques
router.get('/stats', authorize('admin', 'superadmin'), getStats);

// Gestion des utilisateurs
// Accès: admin et superadmin
router.get('/users', authorize('admin', 'superadmin'), listUsers);
router.patch('/users/:id/role', authorize('admin', 'superadmin'), updateUserRole);
router.delete('/users/:id', authorize('admin', 'superadmin'), deleteUser);

// Gestion des posts
// Accès: admin et superadmin
router.get('/posts', authorize('admin', 'superadmin'), listPosts);
router.delete('/posts/:id', authorize('admin', 'superadmin'), deletePost);

module.exports = router;
