const express = require('express');
const { getConversations, getMessages, getOrCreateConversationWithUser, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Toutes les routes ici sont protégées

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/with/:userId', getOrCreateConversationWithUser);
router.delete('/:messageId', deleteMessage);

module.exports = router;