const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Veuillez entrer un nom']
    },
    email: {
        type: String,
        required: [true, 'Veuillez entrer un email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Veuillez fournir un email valide']
    },
    password: {
        type: String,
        required: [true, 'Veuillez entrer un mot de passe'],
        minlength: 6,
        select: false // Ne pas retourner le mot de passe par défaut lors des requêtes
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user'
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    coverUrl: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Crypter le mot de passe avec bcrypt avant de sauvegarder
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Méthode pour comparer les mots de passe saisis avec celui en base de données
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
