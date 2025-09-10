const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Générer le token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Base de données en mémoire pour le mode développement
const inMemoryUsers = [];
let nextUserId = 1;

// Inscription
exports.register = async (req, res) => {
  console.log('Requête d\'inscription reçue:', req.body);
  const { name, email, password } = req.body;
  try {
    // En mode développement, utiliser la base de données en mémoire
    if (process.env.NODE_ENV === 'development') {
      console.log('Mode développement: utilisation de la base de données en mémoire');
      // Vérifier si l'email existe déjà
      const userExists = inMemoryUsers.find(user => user.email === email);
      if (userExists) {
        console.log('Email déjà utilisé:', email);
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
      
      // Créer un nouvel utilisateur avec un ID unique
      const userId = `dev_user_${nextUserId++}`;
      const newUser = { _id: userId, name, email, password: 'hashed_password', createdAt: new Date() };
      inMemoryUsers.push(newUser);
      
      console.log('Nouvel utilisateur créé:', { id: newUser._id, name: newUser.name, email: newUser.email });
      console.log('Utilisateurs en mémoire:', inMemoryUsers);
      
      // Retourner la réponse sans le mot de passe
      return res.status(201).json({ user: { id: newUser._id, name: newUser.name, email: newUser.email }});
    }
    
    // En production, utiliser MongoDB
    console.log('Mode production: utilisation de MongoDB');
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Email déjà utilisé:', email);
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const user = await User.create({ name, email, password });
    console.log('Nouvel utilisateur créé dans MongoDB:', { id: user._id, name: user.name, email: user.email });
    // const token = generateToken(user._id);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }});
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ message: err.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  console.log('Requête de connexion reçue:', { email: req.body.email });
  const { email, password } = req.body;
  try {
    // En mode développement, utiliser la base de données en mémoire
    if (process.env.NODE_ENV === 'development') {
      console.log('Mode développement: utilisation de la base de données en mémoire');
      console.log('Utilisateurs en mémoire:', inMemoryUsers);
      
      const user = inMemoryUsers.find(user => user.email === email);
      if (!user) {
        console.log('Utilisateur non trouvé:', email);
        return res.status(400).json({ message: 'Utilisateur non trouvé' });
      }
      
      console.log('Utilisateur trouvé:', { id: user._id, name: user.name, email: user.email });
      // En mode développement, on accepte n'importe quel mot de passe
      const token = generateToken(user._id);
      console.log('Token généré pour l\'utilisateur');
      return res.status(200).json({ user: { id: user._id, name: user.name, email: user.email }, token });
    }
    
    // En production, utiliser MongoDB
    console.log('Mode production: utilisation de MongoDB');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('Utilisateur non trouvé dans MongoDB:', email);
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    console.log('Connexion réussie pour:', { id: user._id, name: user.name, email: user.email });
    const token = generateToken(user._id);
    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ message: err.message });
  }
};
