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
            select: 'name'
        })
        .populate({
            path: 'lastMessage',
            select: 'content createdAt'
        })
        .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
});

/**
 * @desc    Créer une nouvelle conversation
 * @route   POST /api/messages/conversations
 * @access  Private
 */
exports.createConversation = asyncHandler(async (req, res, next) => {
    const { participantId } = req.body;

    if (!participantId) {
        return next(new ErrorResponse('Veuillez spécifier un participant', 400));
    }

    // Vérifier si une conversation existe déjà entre ces utilisateurs
    const existingConversation = await Conversation.findOne({
        participants: { $all: [req.user.id, participantId] }
    });

    if (existingConversation) {
        return res.status(200).json({ success: true, data: existingConversation });
    }

    const conversation = await Conversation.create({
        participants: [req.user.id, participantId]
    });

    res.status(201).json({ success: true, data: conversation });
});

/**
 * @desc    Récupérer les messages d'une conversation spécifique
 * @route   GET /api/messages/conversations/:conversationId
 * @access  Private
 */
exports.getMessages = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.participants.includes(req.user.id)) {
        return next(new ErrorResponse('Conversation non trouvée ou accès non autorisé', 404));
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
        .populate('sender', 'name')
        .sort({ createdAt: 'asc' });

    res.status(200).json({ success: true, data: messages });
});

/**
 * @desc    Envoyer un nouveau message
 * @route   POST /api/messages/conversations/:conversationId
 * @access  Private
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    const conversationId = req.params.conversationId;

    if (!content) {
        return next(new ErrorResponse('Le contenu du message est requis', 400));
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.participants.includes(req.user.id)) {
        return next(new ErrorResponse('Conversation non trouvée ou accès non autorisé', 404));
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: req.user.id,
        content
    });

    // Mettre à jour le dernier message de la conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    // Peupler les informations du sender pour la réponse
    await message.populate('sender', 'name');

    res.status(201).json({ success: true, data: message });
});