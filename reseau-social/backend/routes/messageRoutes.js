const express = require('express');
const { 
    getConversations, 
    createConversation,
    getMessages, 
    sendMessage 
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Toutes les routes ici sont protégées

// Routes des conversations
router.route('/conversations')
    .get(getConversations)
    .post(createConversation);

// Routes des messages
router.route('/conversations/:conversationId')
    .get(getMessages)
    .post(sendMessage);

module.exports = router;