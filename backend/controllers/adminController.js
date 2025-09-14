// Importation du gestionnaire d'erreurs asynchrones pour éviter les try/catch répétitifs
const asyncHandler = require('../utils/asyncHandler');
// Importation de la classe d'erreur personnalisée pour une gestion d'erreur cohérente
const ErrorResponse = require('../utils/errorResponse');
// Importation du modèle User pour les opérations sur les utilisateurs
const User = require('../models/User');
// Importation du modèle Post pour les opérations sur les publications
const Post = require('../models/Post');
// Importation du modèle Message pour les statistiques de messages
const Message = require('../models/Message');

// Route GET /api/admin/users - Récupère la liste de tous les utilisateurs
exports.listUsers = asyncHandler(async (req, res, next) => {
  // Recherche tous les utilisateurs en excluant le champ mot de passe pour la sécurité
  const users = await User.find().select('-password');
  // Retourne la liste des utilisateurs avec un statut de succès
  res.status(200).json({ success: true, data: users });
});

// Route PATCH /api/admin/users/:id/role - Modifie le rôle d'un utilisateur
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  // Extraction du nouveau rôle depuis le corps de la requête
  const { role } = req.body; // Rôles attendus: 'user' | 'admin' | 'superadmin'
  // Validation que le rôle fourni est valide
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    return next(new ErrorResponse('Rôle invalide', 400));
  }

  // Vérification des permissions: seul un superadmin peut gérer le rôle superadmin
  // fromSuperadmin indique qu'on dégrade un superadmin (nécessite droits superadmin)
  if (role === 'superadmin' || req.body.fromSuperadmin === true) {
    // Vérification que l'utilisateur actuel est bien un superadmin
    if (req.user.role !== 'superadmin') {
      return next(new ErrorResponse('Seul un super administrateur peut définir le rôle superadmin', 403));
    }
  }

  // Recherche de l'utilisateur cible à modifier
  const target = await User.findById(req.params.id);
  // Vérification que l'utilisateur existe
  if (!target) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  // Protection: un admin ne peut pas modifier un superadmin
  if (req.user.role === 'admin' && target.role === 'superadmin') {
    return next(new ErrorResponse('Interdit de modifier un super administrateur', 403));
  }

  // Mise à jour du rôle de l'utilisateur avec validation des données
  const updated = await User.findByIdAndUpdate(
    req.params.id, // ID de l'utilisateur à modifier
    { role }, // Nouveau rôle à assigner
    { new: true, runValidators: true } // Options: retourner le document mis à jour et valider
  ).select('-password'); // Exclure le mot de passe de la réponse

  // Retour de l'utilisateur mis à jour
  res.status(200).json({ success: true, data: updated });
});

// Route DELETE /api/admin/users/:id - Supprime un utilisateur
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Recherche l'utilisateur à supprimer
  const target = await User.findById(req.params.id);
  // Vérification que l'utilisateur existe
  if (!target) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  // Contrôle des permissions: un admin ne peut pas supprimer un admin/superadmin
  if (req.user.role === 'admin' && (target.role === 'admin' || target.role === 'superadmin')) {
    return next(new ErrorResponse('Interdit de supprimer un admin ou superadmin', 403));
  }

  // Suppression en cascade: d'abord tous les posts de l'utilisateur
  await Post.deleteMany({ author: target._id });
  // Puis suppression de l'utilisateur lui-même
  await User.findByIdAndDelete(target._id);

  // Confirmation de la suppression
  res.status(200).json({ success: true, message: 'Utilisateur supprimé' });
});

// Route GET /api/admin/stats - Récupère les statistiques du site
exports.getStats = asyncHandler(async (req, res, next) => {
  // Création de la date du jour à minuit pour compter les nouveaux utilisateurs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Exécution parallèle de toutes les requêtes de comptage pour optimiser les performances
  const [totalUsers, totalPosts, totalMessages, newUsersToday, bannedUsers, activeUsers] = await Promise.all([
    User.countDocuments(), // Nombre total d'utilisateurs
    Post.countDocuments(), // Nombre total de publications
    Message.countDocuments(), // Nombre total de messages
    User.countDocuments({ createdAt: { $gte: today } }), // Nouveaux utilisateurs aujourd'hui
    User.countDocuments({ banned: true }), // Utilisateurs bannis
    User.countDocuments({ banned: { $ne: true } }) // Utilisateurs actifs (non bannis)
  ]);
  
  // Comptage des groupes avec gestion d'erreur si le modèle n'existe pas
  let totalGroups = 0;
  try {
    const Group = require('../models/Group');
    totalGroups = await Group.countDocuments();
  } catch (error) {
    totalGroups = 0; // Valeur par défaut si erreur
  }
  
  // Retour de toutes les statistiques
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalPosts,
      totalMessages,
      newUsersToday,
      totalGroups,
      activeUsers,
      bannedUsers
    }
  });
});

// Route GET /api/admin/posts - Liste les publications pour l'administration
exports.listPosts = asyncHandler(async (req, res, next) => {
  // Récupération des 50 dernières publications avec informations de l'auteur
  const posts = await Post.find()
    .populate('author', 'name') // Inclut le nom de l'auteur
    .sort({ createdAt: -1 }) // Tri par date décroissante
    .limit(50) // Limite à 50 résultats
    .select('textContent type language region author likes comments createdAt'); // Sélection des champs nécessaires
  
  // Transformation des données pour un format cohérent
  const mappedPosts = posts.map(post => ({
    _id: post._id,
    content: post.textContent, // Renommage pour cohérence
    type: post.type,
    language: post.language,
    region: post.region,
    author: post.author,
    likes: post.likes,
    comments: post.comments,
    createdAt: post.createdAt
  }));
  
  // Retour des publications formatées
  res.status(200).json({ success: true, data: mappedPosts });
});

// Route DELETE /api/admin/posts/:id - Supprime une publication
exports.deletePost = asyncHandler(async (req, res, next) => {
  // Recherche la publication à supprimer
  const post = await Post.findById(req.params.id);
  // Vérification que la publication existe
  if (!post) return next(new ErrorResponse('Post non trouvé', 404));
  // Suppression de la publication
  await post.deleteOne();
  // Confirmation de la suppression
  res.status(200).json({ success: true, message: 'Post supprimé' });
});

// Route PATCH /api/admin/users/:id/ban - Bannit ou débannit un utilisateur
exports.banUser = asyncHandler(async (req, res, next) => {
  // Extraction du statut de bannissement depuis la requête
  const { banned } = req.body;
  // Recherche de l'utilisateur cible
  const target = await User.findById(req.params.id);
  // Vérification que l'utilisateur existe
  if (!target) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  // Contrôle des permissions: un admin ne peut pas bannir un admin/superadmin
  if (req.user.role === 'admin' && (target.role === 'admin' || target.role === 'superadmin')) {
    return next(new ErrorResponse('Interdit de bannir un admin ou superadmin', 403));
  }

  // Mise à jour du statut de bannissement
  const updated = await User.findByIdAndUpdate(
    req.params.id, // ID de l'utilisateur
    { banned: banned }, // Nouveau statut
    { new: true, runValidators: true } // Options de mise à jour
  ).select('-password'); // Exclusion du mot de passe

  // Retour de l'utilisateur mis à jour
  res.status(200).json({ success: true, data: updated });
});

// Route GET /api/admin/groups - Liste les groupes pour l'administration
exports.listGroups = asyncHandler(async (req, res, next) => {
  try {
    // Importation dynamique du modèle Group
    const Group = require('../models/Group');
    // Récupération des groupes avec informations du créateur et des membres
    const groups = await Group.find()
      .populate('creator', 'name') // Inclut le nom du créateur
      .populate('members', 'name') // Inclut les noms des membres
      .sort({ createdAt: -1 }) // Tri par date décroissante
      .limit(50); // Limite à 50 résultats
    
    // Retour de la liste des groupes
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    // En cas d'erreur (modèle inexistant), retourne une liste vide
    res.status(200).json({ success: true, data: [] });
  }
});

// Route DELETE /api/admin/groups/:id - Supprime un groupe
exports.deleteGroup = asyncHandler(async (req, res, next) => {
  // Importation du modèle Group
  const Group = require('../models/Group');
  // Recherche du groupe à supprimer
  const group = await Group.findById(req.params.id);
  // Vérification que le groupe existe
  if (!group) return next(new ErrorResponse('Groupe non trouvé', 404));
  // Suppression du groupe
  await group.deleteOne();
  // Confirmation de la suppression
  res.status(200).json({ success: true, message: 'Groupe supprimé' });
});

// Route GET /api/admin/reports - Liste les signalements pour l'administration
exports.listReports = asyncHandler(async (req, res, next) => {
  try {
    // Importation dynamique du modèle Report
    const Report = require('../models/Report');
    // Récupération des signalements avec toutes les informations liées
    const reports = await Report.find()
      .populate('reporter', 'name') // Inclut le nom du rapporteur
      .populate('reportedUser', 'name') // Inclut le nom de l'utilisateur signalé
      .populate('reportedPost') // Inclut les détails de la publication signalée
      .sort({ createdAt: -1 }) // Tri par date décroissante
      .limit(50); // Limite à 50 résultats
    
    // Retour de la liste des signalements
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    // En cas d'erreur, retourne une liste vide
    res.status(200).json({ success: true, data: [] });
  }
});

// Route PATCH /api/admin/reports/:id - Traite un signalement
exports.handleReport = asyncHandler(async (req, res, next) => {
  // Extraction de l'action à effectuer depuis la requête
  const { action } = req.body; // Actions possibles: 'approve' ou 'reject'
  
  // TODO: Implémenter la logique de traitement du signalement
  // (validation, suppression de contenu, sanctions, etc.)
  
  // Retour du résultat du traitement
  res.status(200).json({ 
    success: true, 
    message: `Signalement ${action === 'approve' ? 'approuvé' : 'rejeté'}` 
  });
});
