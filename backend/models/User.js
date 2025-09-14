/**
 * ===========================================
 *            MODÈLE UTILISATEUR (MONGODB)
 * ===========================================
 * 
 * Ce modèle définit la structure des utilisateurs dans la base de données.
 * 
 * CHAMPS PRINCIPAUX :
 * - name : Nom d'affichage de l'utilisateur
 * - email : Adresse email (unique, validée)
 * - password : Mot de passe crypté (non retourné par défaut)
 * - role : Rôle utilisateur (user/admin/superadmin)
 * 
 * PROFIL :
 * - avatarUrl : URL de l'image de profil
 * - coverUrl : URL de l'image de couverture
 * - bio : Description personnelle
 * 
 * SYSTÈME D'ABONNEMENT :
 * - followers : Tableau des IDs des abonnés
 * - following : Tableau des IDs des abonnements
 * 
 * SÉCURITÉ :
 * - Cryptage automatique du mot de passe avec bcrypt
 * - Validation email avec validator.js
 * - Méthode de comparaison sécurisée des mots de passe
 * 
 * HOOKS MONGOOSE :
 * - pre('save') : Cryptage du mot de passe avant sauvegarde
 * - matchPassword() : Méthode de vérification du mot de passe
 * 
 * ===========================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
    // ========== INFORMATIONS DE BASE ==========
    name: {
        type: String,
        required: [true, 'Veuillez entrer un nom']
    },
    email: {
        type: String,
        required: [true, 'Veuillez entrer un email'],
        unique: true,                                    // Index unique automatique
        lowercase: true,                                 // Conversion en minuscules
        validate: [validator.isEmail, 'Veuillez fournir un email valide']
    },
    password: {
        type: String,
        required: [true, 'Veuillez entrer un mot de passe'],
        minlength: 6,
        select: false // ⚠️ IMPORTANT : Ne jamais retourner le mot de passe
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user'
    },
    banned: {
        type: Boolean,
        default: false
    },
    
    // ========== PROFIL UTILISATEUR ==========
    avatarUrl: {
        type: String,
        default: ''                                      // URL relative vers l'image
    },
    coverUrl: {
        type: String,
        default: ''                                      // URL relative vers l'image
    },
    bio: {
        type: String,
        default: ''                                      // Description personnelle
    },
    
    // ========== SYSTÈME D'ABONNEMENT ==========
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'                                      // Référence vers d'autres utilisateurs
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'                                      // Référence vers d'autres utilisateurs
    }],
    
    // ========== MÉTADONNÉES ==========
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ========== MIDDLEWARE DE CRYPTAGE ==========
// Hook exécuté avant chaque sauvegarde
UserSchema.pre('save', async function(next) {
    // Ne crypter que si le mot de passe a été modifié
    if (!this.isModified('password')) {
        return next();
    }
    
    // Génération du salt et cryptage
    const salt = await bcrypt.genSalt(10);           // Coût de 10 (recommandé)
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ========== MÉTHODE DE VÉRIFICATION ==========
// Méthode d'instance pour vérifier le mot de passe
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // Comparaison sécurisée avec bcrypt
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

/**
 * ===========================================
 *              NOTES TECHNIQUES
 * ===========================================
 * 
 * INDEX RECOMMANDÉS :
 * - email (unique, automatique)
 * - followers (pour les requêtes de recherche d'abonnés)
 * - following (pour les requêtes de recherche d'abonnements)
 * 
 * RELATIONS :
 * - followers/following : Relations many-to-many avec auto-référence
 * - Posts : Relation one-to-many (un utilisateur a plusieurs posts)
 * 
 * SÉCURITÉ :
 * - Mot de passe : Crypté avec bcrypt (salt de 10)
 * - Email : Validé et normalisé en minuscules
 * - select: false sur password pour éviter les fuites
 * 
 * PERFORMANCE :
 * - populate() utilisé pour charger les relations
 * - Sélection spécifique des champs pour réduire la bande passante
 * 
 * ===========================================
 */
