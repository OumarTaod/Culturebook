const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

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
      bio: user.bio || '',
      stats: {
        posts: postsCount,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
      },
    },
  });
});

// GET /api/users/:id/posts
exports.getUserPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ author: req.params.id })
    .populate('author', 'name avatarUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: posts });
});

// PATCH /api/users/:id
exports.updateUser = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() !== req.params.id.toString()) {
    return next(new ErrorResponse('Accès non autorisé', 403));
  }

  const updates = {};
  if (typeof req.body.bio === 'string') updates.bio = req.body.bio;
  if (req.file) updates.avatarUrl = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({ success: true, data: user });
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

  res.status(200).json({ success: true });
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

  res.status(200).json({ success: true });
});
