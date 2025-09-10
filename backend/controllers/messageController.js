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

    const messages = await Message.find({ conversation: req.params.conversationId }).sort({ createdAt: 'asc' });

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