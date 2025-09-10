const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Récupérer le token de l'en-tête
            token = req.headers.authorization.split(' ')[1];

            // Vérifier le token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Ajouter l'utilisateur à la requête
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, error: 'Non autorisé, le token a échoué' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Non autorisé, pas de token' });
    }
};

// Middleware d'autorisation basé sur les rôles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Accès interdit' });
        }
        next();
    };
};

module.exports = { protect, authorize };