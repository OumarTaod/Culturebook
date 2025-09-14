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
const { getUserById, getUserPosts, updateUser, changePassword, getSuggestions, followUser, unfollowUser, listUsers, getUserFollowing, getUserFollowers, getContacts } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// ========== ROUTES GÉNÉRALES ==========
router.get('/', listUsers);                    // Liste tous les utilisateurs
router.get('/suggestions', protect, getSuggestions); // Suggestions (auth requise)
router.get('/contacts', protect, getContacts); // Contacts (abonnés + abonnements)
router.patch('/change-password', protect, changePassword); // Changement mot de passe

// ========== ACTIONS D'ABONNEMENT ==========
router.get('/:id/is-following', protect, (req, res) => {
  try {
    if (!req.user || !req.params.id) {
      return res.status(400).json({ error: 'Données manquantes' });
    }
    const isFollowing = req.user.following?.some(id => id.toString() === req.params.id) || false;
    res.json({ isFollowing });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
router.post('/:id/follow', protect, followUser);    // Suivre un utilisateur
router.delete('/:id/follow', protect, unfollowUser); // Ne plus suivre

// ========== MODIFICATION PROFIL ==========
router.patch('/:id', protect, upload.fields([{ name: 'avatar' }, { name: 'cover' }]), updateUser);

// ========== INFORMATIONS UTILISATEUR ==========
router.get('/:id', getUserById);               // Profil utilisateur
router.get('/:id/posts', getUserPosts);        // Publications (FILTRÉES par utilisateur) ⭐
router.get('/:id/following', getUserFollowing); // Liste des abonnements
router.get('/:id/followers', getUserFollowers); // Liste des abonnés

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
