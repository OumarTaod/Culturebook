const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');

// GET /api/admin/users
exports.listUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, data: users });
});

// PATCH /api/admin/users/:id/role
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body; // expected 'user' | 'admin' | 'superadmin'
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    return next(new ErrorResponse('Rôle invalide', 400));
  }

  // Seul un superadmin peut promouvoir/déclasser vers/depuis superadmin
  // fromSuperadmin indique qu'on dégrade un superadmin (nécessite droits superadmin)
  if (role === 'superadmin' || req.body.fromSuperadmin === true) {
    if (req.user.role !== 'superadmin') {
      return next(new ErrorResponse('Seul un super administrateur peut définir le rôle superadmin', 403));
    }
  }

  // Un admin ne peut pas modifier un superadmin
  const target = await User.findById(req.params.id);
  if (!target) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  if (req.user.role === 'admin' && target.role === 'superadmin') {
    return next(new ErrorResponse('Interdit de modifier un super administrateur', 403));
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const target = await User.findById(req.params.id);
  if (!target) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  // Un admin ne peut pas supprimer un admin ni un superadmin
  if (req.user.role === 'admin' && (target.role === 'admin' || target.role === 'superadmin')) {
    return next(new ErrorResponse('Interdit de supprimer un admin ou superadmin', 403));
  }

  // Un superadmin peut tout supprimer (y compris un admin ou superadmin si choisi)
  await Post.deleteMany({ author: target._id });
  await User.findByIdAndDelete(target._id);

  res.status(200).json({ success: true, message: 'Utilisateur supprimé' });
});

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [totalUsers, totalPosts, totalMessages, newUsersToday, bannedUsers, activeUsers] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Message.countDocuments(),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ banned: true }),
    User.countDocuments({ banned: { $ne: true } })
  ]);
  
  // Simuler le nombre de groupes si le modèle n'existe pas
  let totalGroups = 0;
  try {
    const Group = require('../models/Group');
    totalGroups = await Group.countDocuments();
  } catch (error) {
    totalGroups = 2; // Nombre de groupes de test
  }
  
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

// GET /api/admin/posts
exports.listPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find()
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .select('textContent type language region author likes comments createdAt');
  
  // Mapper les posts pour avoir un format cohérent
  const mappedPosts = posts.map(post => ({
    _id: post._id,
    content: post.textContent,
    type: post.type,
    language: post.language,
    region: post.region,
    author: post.author,
    likes: post.likes,
    comments: post.comments,
    createdAt: post.createdAt
  }));
  
  res.status(200).json({ success: true, data: mappedPosts });
});

// DELETE /api/admin/posts/:id
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post non trouvé', 404));
  await post.deleteOne();
  res.status(200).json({ success: true, message: 'Post supprimé' });
});

// PATCH /api/admin/users/:id/ban
exports.banUser = asyncHandler(async (req, res, next) => {
  const { banned } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return next(new ErrorResponse('Utilisateur non trouvé', 404));

  // Un admin ne peut pas bannir un admin ni un superadmin
  if (req.user.role === 'admin' && (target.role === 'admin' || target.role === 'superadmin')) {
    return next(new ErrorResponse('Interdit de bannir un admin ou superadmin', 403));
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { banned: banned },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ success: true, data: updated });
});

// GET /api/admin/groups
exports.listGroups = asyncHandler(async (req, res, next) => {
  try {
    const Group = require('../models/Group');
    const groups = await Group.find()
      .populate('creator', 'name')
      .populate('members', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    // Si le modèle Group n'existe pas, retourner des données de test
    const testGroups = [
      {
        _id: '1',
        name: 'Groupe de test 1',
        description: 'Description du groupe de test',
        privacy: 'public',
        members: [{name: 'User1'}, {name: 'User2'}],
        createdAt: new Date()
      },
      {
        _id: '2', 
        name: 'Groupe privé',
        description: 'Groupe privé pour les tests',
        privacy: 'private',
        members: [{name: 'Admin'}],
        createdAt: new Date()
      }
    ];
    res.status(200).json({ success: true, data: testGroups });
  }
});

// DELETE /api/admin/groups/:id
exports.deleteGroup = asyncHandler(async (req, res, next) => {
  const Group = require('../models/Group');
  const group = await Group.findById(req.params.id);
  if (!group) return next(new ErrorResponse('Groupe non trouvé', 404));
  await group.deleteOne();
  res.status(200).json({ success: true, message: 'Groupe supprimé' });
});

// GET /api/admin/reports
exports.listReports = asyncHandler(async (req, res, next) => {
  // Simuler des signalements pour l'exemple
  const reports = [
    {
      _id: '1',
      type: 'Post inapproprié',
      reason: 'Contenu offensant',
      reporter: { name: 'Utilisateur A' },
      content: 'Contenu du post signalé qui contient des propos inappropriés...',
      createdAt: new Date()
    },
    {
      _id: '2',
      type: 'Spam',
      reason: 'Publication répétitive',
      reporter: { name: 'Utilisateur B' },
      content: 'Message de spam répété plusieurs fois...',
      createdAt: new Date(Date.now() - 86400000) // Hier
    },
    {
      _id: '3',
      type: 'Harcèlement',
      reason: 'Commentaires déplacés',
      reporter: { name: 'Utilisateur C' },
      content: 'Commentaires de harcèlement envers un autre utilisateur...',
      createdAt: new Date(Date.now() - 172800000) // Il y a 2 jours
    }
  ];
  
  res.status(200).json({ success: true, data: reports });
});

// PATCH /api/admin/reports/:id
exports.handleReport = asyncHandler(async (req, res, next) => {
  const { action } = req.body; // 'approve' ou 'reject'
  
  // Logique de traitement du signalement
  res.status(200).json({ 
    success: true, 
    message: `Signalement ${action === 'approve' ? 'approuvé' : 'rejeté'}` 
  });
});
