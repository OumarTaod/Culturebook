/**
 * ===========================================
 *           ROUTES UTILISATEUR (BACKEND)
 * ===========================================
 * 
 * Ce fichier définit toutes les routes liées aux utilisateurs.
 * 
 * ROUTES PUBLIQUES :
 * GET /api/users              - Liste des utilisateurs (avec recherche)
 * GET /api/users/:id          - Profil d'un utilisateur
 * GET /api/users/:id/posts    - Publications d'un utilisateur
 * GET /api/users/:id/following - Abonnements d'un utilisateur
 * GET /api/users/:id/followers - Abonnés d'un utilisateur
 * 
 * ROUTES PROTÉGÉES (authentification requise) :
 * GET /api/users/suggestions  - Suggestions d'utilisateurs à suivre
 * POST /api/users/:id/follow  - Suivre un utilisateur
 * DELETE /api/users/:id/follow - Ne plus suivre un utilisateur
 * PATCH /api/users/:id        - Mettre à jour son profil (avec upload)
 * 
 * MIDDLEWARES UTILISÉS :
 * - protect : Vérification de l'authentification JWT
 * - upload : Gestion des fichiers multipart (avatar, couverture)
 * 
 * ORDRE DES ROUTES :
 * Les routes spécifiques sont définies avant les routes paramétrées
 * pour éviter les conflits de routage.
 * 
 * ===========================================
 */

const express = require('express');
const { getUserById, getUserPosts, updateUser, getSuggestions, followUser, unfollowUser, listUsers, getUserFollowing, getUserFollowers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// ========== ROUTES GÉNÉRALES ==========
router.get('/', listUsers);                    // Liste tous les utilisateurs
router.get('/suggestions', protect, getSuggestions); // Suggestions (auth requise)

// ========== ACTIONS D'ABONNEMENT ==========
router.post('/:id/follow', protect, followUser);    // Suivre un utilisateur
router.delete('/:id/follow', protect, unfollowUser); // Ne plus suivre

// ========== INFORMATIONS UTILISATEUR ==========
router.get('/:id', getUserById);               // Profil utilisateur
router.get('/:id/posts', getUserPosts);        // Publications (FILTRÉES par utilisateur) ⭐
router.get('/:id/following', getUserFollowing); // Liste des abonnements
router.get('/:id/followers', getUserFollowers); // Liste des abonnés

// ========== MODIFICATION PROFIL ==========
// Upload multipart pour avatar et couverture
router.patch('/:id', protect, upload.fields([{ name: 'avatar' }, { name: 'cover' }]), updateUser);

module.exports = router;

/**
 * ===========================================
 *              NOTES SUR LE ROUTAGE
 * ===========================================
 * 
 * ORDRE D'IMPORTANCE :
 * 1. Routes générales (/, /suggestions)
 * 2. Routes d'action (/follow)
 * 3. Routes spécifiques (/:id, /:id/posts, etc.)
 * 
 * SÉCURITÉ :
 * - Middleware protect() pour les opérations sensibles
 * - Upload sécurisé avec validation des types de fichiers
 * - Validation des paramètres dans les contrôleurs
 * 
 * PERFORMANCE :
 * - Routes optimisées pour minimiser les requêtes DB
 * - Pagination sur la liste des utilisateurs
 * - Population sélective des champs nécessaires
 * 
 * ===========================================
 */
