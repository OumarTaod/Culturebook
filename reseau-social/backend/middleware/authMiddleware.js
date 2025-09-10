const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    // En mode développement, créer un utilisateur fictif pour les tests
    if (process.env.NODE_ENV === 'development') {
        req.user = {
            id: '123456789012345678901234',
            name: 'Utilisateur Test',
            email: 'test@example.com'
        };
        return next();
    }

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
    } else if (!token) {
        return res.status(401).json({ success: false, error: 'Non autorisé, pas de token' });
    }
};

module.exports = { protect };