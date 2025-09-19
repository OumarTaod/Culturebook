const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * @desc    Récupérer toutes les conversations de l'utilisateur
 * @route   GET /api/messages/conversations
 * @access  Private
 */
exports.getConversations = asyncHandler(async (req, res, next) => {
    const conversations = await Conversation.find({ participants: req.user.id })
        .populate({
            path: 'participants',
            select: 'name' // Ne renvoyer que le nom des participants
        })
        .populate({
            path: 'lastMessage',
            select: 'content createdAt'
        })
        .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
});

/**
 * @desc    Récupérer les messages d'une conversation spécifique
 * @route   GET /api/messages/conversations/:conversationId
 * @access  Private
 */
exports.getMessages = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.participants.includes(req.user.id)) {
        return next(new ErrorResponse("Conversation non trouvée ou accès non autorisé", 404));
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
        .populate('sender', 'name')
        .sort({ createdAt: 'asc' });

    res.status(200).json({ success: true, data: messages });
});

/**
 * @desc    Obtenir ou créer une conversation avec un utilisateur cible
 * @route   POST /api/messages/conversations/with/:userId
 * @access  Private
 */
exports.getOrCreateConversationWithUser = asyncHandler(async (req, res, next) => {
    const otherUserId = req.params.userId;
    if (!otherUserId) {
        return next(new ErrorResponse('Identifiant utilisateur manquant', 400));
    }
    if (otherUserId.toString() === req.user.id.toString()) {
        return next(new ErrorResponse('Impossible de démarrer une conversation avec vous-même', 400));
    }

    let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, otherUserId] }
    })
    .populate({ path: 'participants', select: 'name' })
    .populate({ path: 'lastMessage', select: 'content createdAt' });

    if (!conversation) {
        const created = await Conversation.create({ participants: [req.user.id, otherUserId] });
        conversation = await Conversation.findById(created._id)
            .populate({ path: 'participants', select: 'name' })
            .populate({ path: 'lastMessage', select: 'content createdAt' });
    }

    res.status(200).json({ success: true, data: conversation });
});

/**
 * @desc    Supprimer un message
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
exports.deleteMessage = asyncHandler(async (req, res, next) => {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
        return next(new ErrorResponse('Message non trouvé', 404));
    }

    // Vérifier que l'utilisateur est l'auteur du message
    if (message.sender.toString() !== req.user.id.toString()) {
        return next(new ErrorResponse('Non autorisé à supprimer ce message', 403));
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.status(200).json({ success: true, message: 'Message supprimé' });
});

/**
 * @desc    Obtenir le nombre total de messages non lus
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
exports.getUnreadMessagesCount = asyncHandler(async (req, res, next) => {
    const conversations = await Conversation.find({ participants: req.user.id });
    const conversationIds = conversations.map(c => c._id);
    
    const unreadCount = await Message.countDocuments({
        conversation: { $in: conversationIds },
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id }
    });

    res.status(200).json({ success: true, count: unreadCount });
});

/**
 * @desc    Obtenir le nombre de messages non lus par conversation
 * @route   GET /api/messages/unread-counts
 * @access  Private
 */
exports.getUnreadCountsPerConversation = asyncHandler(async (req, res, next) => {
    const conversations = await Conversation.find({ participants: req.user.id });
    const counts = {};
    
    for (const conversation of conversations) {
        const unreadCount = await Message.countDocuments({
            conversation: conversation._id,
            sender: { $ne: req.user.id },
            'readBy.user': { $ne: req.user.id }
        });
        counts[conversation._id] = unreadCount;
    }

    res.status(200).json({ success: true, counts });
});

/**
 * @desc    Marquer tous les messages d'une conversation comme lus
 * @route   PUT /api/messages/conversations/:conversationId/mark-read
 * @access  Private
 */
exports.markConversationAsRead = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.participants.includes(req.user.id)) {
        return next(new ErrorResponse("Conversation non trouvée ou accès non autorisé", 404));
    }

    // Marquer tous les messages non lus de cette conversation comme lus
    await Message.updateMany(
        {
            conversation: req.params.conversationId,
            sender: { $ne: req.user.id },
            'readBy.user': { $ne: req.user.id }
        },
        {
            $push: {
                readBy: {
                    user: req.user.id,
                    readAt: new Date()
                }
            }
        }
    );

    res.status(200).json({ success: true, message: 'Messages marqués comme lus' });
});