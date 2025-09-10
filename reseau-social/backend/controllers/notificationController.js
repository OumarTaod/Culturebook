const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

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
