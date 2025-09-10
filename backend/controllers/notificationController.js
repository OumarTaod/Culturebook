const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Récupérer les notifications de l'utilisateur authentifié
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .populate('sender', 'name')
    .populate('post', 'textContent')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

/**
 * @desc    Marquer toutes les notifications comme lues
 * @route   PATCH /api/notifications/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    success: true,
    data: 'Notifications marquées comme lues.',
  });
});

/**
 * @desc    Marquer une notification comme lue
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
exports.markOneAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) {
    return next(new ErrorResponse('Notification non trouvée', 404));
  }

  res.status(200).json({ success: true, data: notification });
});
