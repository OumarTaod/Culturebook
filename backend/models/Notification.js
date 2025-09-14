const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    // L'utilisateur qui reçoit la notification
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    // L'utilisateur qui a déclenché la notification
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'follow', 'group_invite'],
        required: true,
    },
    // Le post qui a été aimé ou commenté
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
    },
    // Message de la notification
    message: {
        type: String
    },
    // Données supplémentaires (pour les invitations de groupe)
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', NotificationSchema);