const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Conte', 'Proverbe', 'Histoire'],
        required: [true, 'Veuillez spécifier le type de publication']
    },
    language: {
        type: String,
        required: [true, 'Veuillez spécifier la langue/ethnie']
    },
    region: {
        type: String,
        required: [true, 'Veuillez spécifier la région']
    },
    textContent: {
        type: String,
        required: [true, 'Veuillez ajouter un contenu texte']
    },
    imageUrl: {
        type: String
    },
    videoUrl: {
        type: String
    },
    audioUrl: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Commentaire'
    }],
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', PostSchema);