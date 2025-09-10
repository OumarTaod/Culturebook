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
    content: {
        type: String,
        required: [true, 'Veuillez ajouter un contenu']
    },
    mediaType: {
        type: String,
        enum: ['none', 'image', 'video', 'audio'],
        default: 'none'
    },
    mediaUrl: {
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', PostSchema);