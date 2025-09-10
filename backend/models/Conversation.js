const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    // Tableau contenant les IDs des deux participants
    participants: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

module.exports = mongoose.model('Conversation', ConversationSchema);