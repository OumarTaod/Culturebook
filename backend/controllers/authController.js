// Importation du modèle User pour les opérations d'authentification
const User = require('../models/User');
// Importation de la librairie JWT pour la gestion des tokens
const jwt = require('jsonwebtoken');

// Fonction utilitaire pour générer un token JWT
const generateToken = (userId, userRole = 'user') => {
  // Définition de la durée de vie du token selon le rôle
  const expiresIn = ['admin', 'superadmin'].includes(userRole) ? '90d' : '7d';
  // Création et signature du token avec l'ID utilisateur
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Route POST /api/auth/register - Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  // Extraction des données d'inscription depuis le corps de la requête
  const { name, email, password } = req.body;
  try {
    // Vérification que l'email n'est pas déjà utilisé
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Création du nouvel utilisateur (le mot de passe sera hashé automatiquement)
    const user = await User.create({ name, email, password });
    // Retour des informations utilisateur (sans le mot de passe)
    res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email }});
  } catch (err) {
    // Gestion des erreurs de création
    res.status(500).json({ message: err.message });
  }
};

// Route POST /api/auth/login - Connexion d'un utilisateur
exports.login = async (req, res) => {
  // Extraction des identifiants de connexion
  const { email, password } = req.body;
  try {
    // Recherche de l'utilisateur avec inclusion du mot de passe hashé
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    // Vérification du mot de passe avec la méthode du modèle
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Mot de passe incorrect' });

    // Génération du token JWT pour la session
    const token = generateToken(user._id, user.role);
    // Retour des informations utilisateur et du token
    res.status(200).json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    // Gestion des erreurs de connexion
    res.status(500).json({ message: err.message });
  }
};

// Route GET /api/auth/profile - Récupération du profil utilisateur authentifié
exports.profile = async (req, res) => {
  // req.user est injecté par le middleware d'authentification
  // Retour des informations de profil
  res.status(200).json({ _id: req.user._id, name: req.user.name, email: req.user.email });
};

// Route POST /api/auth/refresh - Rafraîchissement du token JWT
exports.refreshToken = async (req, res) => {
  try {
    // req.user est déjà vérifié par le middleware d'authentification
    // Génération d'un nouveau token avec la même durée de vie
    const newToken = generateToken(req.user._id, req.user.role);
    // Retour du nouveau token et des informations utilisateur
    res.status(200).json({ 
      success: true, 
      token: newToken,
      user: { 
        _id: req.user._id, 
        name: req.user.name, 
        email: req.user.email, 
        role: req.user.role 
      }
    });
  } catch (err) {
    // Gestion des erreurs de rafraîchissement
    res.status(500).json({ success: false, message: err.message });
  }
};
