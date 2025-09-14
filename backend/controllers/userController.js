/**
 * ===========================================
 *        CONTRÔLEUR UTILISATEUR (BACKEND)
 * ===========================================
 * 
 * Ce contrôleur gère toutes les opérations liées aux utilisateurs :
 * 
 * GESTION DES PROFILS :
 * - Récupération des informations utilisateur
 * - Mise à jour du profil (bio, avatar, couverture)
 * - Statistiques utilisateur (posts, followers, following)
 * 
 * SYSTÈME D'ABONNEMENT :
 * - Suivre/ne plus suivre un utilisateur
 * - Récupérer la liste des abonnements (following)
 * - Récupérer la liste des abonnés (followers)
 * 
 * GESTION DES PUBLICATIONS :
 * - Récupération des posts d'un utilisateur spécifique
 * - Filtrage automatique par auteur
 * 
 * RECHERCHE ET SUGGESTIONS :
 * - Liste paginée des utilisateurs avec recherche
 * - Suggestions d'utilisateurs à suivre
 * 
 * ENDPOINTS DISPONIBLES :
 * GET    /api/users              - Liste des utilisateurs
 * GET    /api/users/:id          - Profil utilisateur
 * GET    /api/users/:id/posts    - Publications d'un utilisateur
 * GET    /api/users/:id/following - Abonnements d'un utilisateur
 * GET    /api/users/:id/followers - Abonnés d'un utilisateur
 * PATCH  /api/users/:id          - Mise à jour profil
 * POST   /api/users/:id/follow   - Suivre un utilisateur
 * DELETE /api/users/:id/follow   - Ne plus suivre
 * 
 * ===========================================
 */

const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// GET /api/users (list with pagination and search)
exports.listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const qRaw = (req.query.q || '').toString().trim();

  const filter = {};
  if (qRaw) {
    filter.$or = [
      { name: { $regex: qRaw, $options: 'i' } },
      { email: { $regex: qRaw, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('_id name email avatarUrl bio')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: users,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});

// GET /api/users/:id
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  const postsCount = await Post.countDocuments({ author: user._id });

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      coverUrl: user.coverUrl || '',
      bio: user.bio || '',
      stats: {
        posts: postsCount,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
      },
    },
  });
});

// GET /api/users/:id/posts - Récupère les publications d'un utilisateur spécifique
exports.getUserPosts = asyncHandler(async (req, res, next) => {
  // FILTRAGE AUTOMATIQUE : Seules les publications de cet utilisateur sont récupérées
  // Ceci garantit que chaque profil n'affiche que ses propres publications
  const posts = await Post.find({ author: req.params.id }) // Filtre par auteur
    .populate('author', 'name avatarUrl') // Informations de l'auteur
    .sort({ createdAt: -1 }); // Tri par date décroissante (plus récent en premier)

  res.status(200).json({ success: true, data: posts });
});

// PATCH /api/users/:id
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Debug logs to trace profile update issues
  if (process.env.NODE_ENV !== 'test') {
    console.log('PATCH /api/users/:id called', {
      paramId: req.params.id,
      authedUserId: req.user?._id?.toString?.(),
      hasFiles: Boolean(req.files),
      fileKeys: req.files ? Object.keys(req.files) : [],
      bodyKeys: Object.keys(req.body || {})
    });
  }
  if (req.user._id.toString() !== req.params.id.toString()) {
    return next(new ErrorResponse('Accès non autorisé', 403));
  }

  const updates = {};
  if (typeof req.body.bio === 'string') updates.bio = req.body.bio;
  if (req.files) {
    const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : undefined;
    const coverFile = Array.isArray(req.files.cover) ? req.files.cover[0] : undefined;
    if (avatarFile) updates.avatarUrl = `/uploads/${avatarFile.filename}`;
    if (coverFile) updates.coverUrl = `/uploads/${coverFile.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({ success: true, data: user });
});

// PATCH /api/users/change-password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Mot de passe actuel et nouveau mot de passe requis', 400));
  }
  
  if (newPassword.length < 6) {
    return next(new ErrorResponse('Le nouveau mot de passe doit contenir au moins 6 caractères', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new ErrorResponse('Utilisateur non trouvé', 404));
  }
  
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès' });
});

// PATCH /api/users/:id/role (superadmin only) - kept in admin controller instead

// GET /api/users/suggestions
exports.getSuggestions = asyncHandler(async (req, res, next) => {
  const excludeIds = [req.user._id, ...(req.user.following || [])];
  const suggestions = await User.find({ _id: { $nin: excludeIds } })
    .select('_id name avatarUrl bio')
    .limit(20);
  res.status(200).json({ success: true, data: suggestions });
});

// POST /api/users/:id/follow
exports.followUser = asyncHandler(async (req, res, next) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    return next(new ErrorResponse('Impossible de se suivre soi-même', 400));
  }
  const user = await User.findById(req.user._id);
  const target = await User.findById(targetId);
  if (!target) return next(new ErrorResponse('Utilisateur cible non trouvé', 404));

  if (!user.following.includes(target._id)) {
    user.following.push(target._id);
    await user.save();
  }
  if (!target.followers.includes(user._id)) {
    target.followers.push(user._id);
    await target.save();
  }

  res.status(200).json({ success: true, isFollowing: true });
});

// DELETE /api/users/:id/follow
exports.unfollowUser = asyncHandler(async (req, res, next) => {
  const targetId = req.params.id;
  const user = await User.findById(req.user._id);
  const target = await User.findById(targetId);
  if (!target) return next(new ErrorResponse('Utilisateur cible non trouvé', 404));

  user.following = user.following.filter((id) => id.toString() !== target._id.toString());
  target.followers = target.followers.filter((id) => id.toString() !== user._id.toString());
  await user.save();
  await target.save();

  res.status(200).json({ success: true, isFollowing: false });
});

// GET /api/users/:id/following - Récupère la liste des abonnements d'un utilisateur
exports.getUserFollowing = asyncHandler(async (req, res, next) => {
  // Recherche de l'utilisateur avec population des abonnements
  // populate() permet de récupérer les détails complets des utilisateurs suivis
  const user = await User.findById(req.params.id)
    .populate('following', '_id name avatarUrl bio') // Sélection des champs nécessaires
    .select('following'); // Ne récupère que le champ following
  
  // Vérification de l'existence de l'utilisateur
  if (!user) return next(new ErrorResponse('Utilisateur non trouvé', 404));
  
  // Retour de la liste des abonnements
  res.status(200).json({ success: true, data: user.following });
});

// GET /api/users/:id/followers - Récupère la liste des abonnés d'un utilisateur
exports.getUserFollowers = asyncHandler(async (req, res, next) => {
  // Recherche de l'utilisateur avec population des abonnés
  // Même logique que pour les abonnements mais pour les followers
  const user = await User.findById(req.params.id)
    .populate('followers', '_id name avatarUrl bio') // Détails des abonnés
    .select('followers'); // Ne récupère que le champ followers
  
  // Vérification de l'existence de l'utilisateur
  if (!user) return next(new ErrorResponse('Utilisateur non trouvé', 404));
  
  // Retour de la liste des abonnés
  res.status(200).json({ success: true, data: user.followers });
});

/**
 * ===========================================
 *                NOTES TECHNIQUES
 * ===========================================
 * 
 * OPTIMISATIONS MONGODB :
 * - Utilisation de populate() pour éviter les requêtes multiples
 * - Sélection spécifique des champs pour réduire la bande passante
 * - Index sur les champs followers/following pour les performances
 * 
 * SÉCURITÉ :
 * - Validation des paramètres d'entrée
 * - Gestion des erreurs avec messages appropriés
 * - Authentification requise pour certaines opérations
 * 
 * GESTION DES ERREURS :
 * - asyncHandler pour la gestion automatique des erreurs async
 * - ErrorResponse pour des messages d'erreur standardisés
 * - Codes de statut HTTP appropriés
 * 
 * ===========================================
 */
