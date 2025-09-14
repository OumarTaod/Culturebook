// Importation de la librairie JWT pour la vérification des tokens
const jwt = require('jsonwebtoken');
// Importation du modèle User pour récupérer les données utilisateur
const User = require('../models/User');

// Middleware de protection des routes - Vérifie l'authentification JWT
const protect = async (req, res, next) => {
    let token;

    // Vérification de la présence de l'en-tête Authorization avec Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extraction du token depuis l'en-tête (format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Vérification et décodage du token JWT avec la clé secrète
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Récupération des données utilisateur depuis la base de données
            req.user = await User.findById(decoded.id).select('-password');
            
            // Vérification que l'utilisateur existe toujours
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
            }
            
            // Vérification que l'utilisateur n'est pas banni
            if (req.user.banned) {
                return res.status(403).json({ success: false, error: 'Compte banni' });
            }

            // Passage au middleware suivant si tout est valide
            next();
        } catch (error) {
            // Log de l'erreur pour le débogage
            console.error('Erreur token:', error.message);
            
            // Gestion spécifique des erreurs de token expiré
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Token expiré', 
                    code: 'TOKEN_EXPIRED' // Code pour le refresh automatique côté client
                });
            }
            
            // Gestion des erreurs de token invalide (malformé, signature incorrecte)
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Token invalide', 
                    code: 'TOKEN_INVALID'
                });
            }
            
            // Gestion des autres erreurs de token
            return res.status(401).json({ 
                success: false, 
                error: 'Non autorisé, le token a échoué',
                code: 'TOKEN_ERROR'
            });
        }
    }

    // Erreur si aucun token n'est fourni
    if (!token) {
        return res.status(401).json({ success: false, error: 'Non autorisé, pas de token' });
    }
};

// Middleware d'autorisation basé sur les rôles utilisateur
// Fonction de haut niveau qui retourne un middleware configuré avec les rôles autorisés
const authorize = (...roles) => {
    // Middleware réel qui vérifie les permissions
    return (req, res, next) => {
        // Vérification que l'utilisateur est authentifié et a un rôle autorisé
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Accès interdit' });
        }
        // Passage au middleware suivant si les permissions sont valides
        next();
    };
};

// Export des middlewares pour utilisation dans les routes
module.exports = { protect, authorize };