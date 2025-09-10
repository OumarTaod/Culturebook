const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Post = require('../models/Post');

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

// DELETE /api/admin/posts/:id
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new ErrorResponse('Post non trouvé', 404));
  await post.deleteOne();
  res.status(200).json({ success: true, message: 'Post supprimé' });
});
