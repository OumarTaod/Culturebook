const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Générer le token
const generateToken = (userId, userRole = 'user') => {
  // Les admins ont des tokens plus longs
  const expiresIn = ['admin', 'superadmin'].includes(userRole) ? '30d' : '7d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Inscription
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email déjà utilisé' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = generateToken(user._id, user.role);
    res.status(200).json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Profil (utilisateur authentifié)
exports.profile = async (req, res) => {
  // req.user est injecté par le middleware protect
  res.status(200).json({ _id: req.user._id, name: req.user.name, email: req.user.email });
};

// Rafraîchir le token
exports.refreshToken = async (req, res) => {
  try {
    // req.user est déjà vérifié par le middleware protect
    const newToken = generateToken(req.user._id, req.user.role);
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
    res.status(500).json({ success: false, message: err.message });
  }
};
