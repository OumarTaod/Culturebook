// Importation du framework Express pour créer le serveur web
const express = require('express');
// Importation de CORS pour gérer les requêtes cross-origin
const cors = require('cors');
// Importation des utilitaires de gestion de chemins
const path = require('path');
// Importation du module de système de fichiers
const fs = require('fs');
// Chargement des variables d'environnement depuis le fichier .env
require('dotenv').config();
// Importation de la fonction de connexion à MongoDB
const connectDB = require('./config/db');

// Création de l'application Express
const app = express();
// Définition du port d'écoute (variable d'environnement ou 5000 par défaut)
const PORT = process.env.PORT || 5000;

// Vérification et création du dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  // Création récursive du dossier uploads
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration des middlewares Express
// Middleware CORS pour autoriser les requêtes depuis le frontend
app.use(cors({
  origin: [
    'http://localhost:3000', // React dev server
    'http://127.0.0.1:3000',
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Méthodes HTTP autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers autorisés
  credentials: true // Autoriser l'envoi de cookies
}));
// Middleware pour parser le JSON dans les requêtes
app.use(express.json());
// Middleware pour parser les données de formulaire URL-encoded
app.use(express.urlencoded({ extended: true }));
// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(uploadsDir));

// Établissement de la connexion à la base de données MongoDB
connectDB();

// ========== INTÉGRATION SOCKET.IO POUR LA COMMUNICATION TEMPS RÉEL ==========
// Importation du module HTTP natif de Node.js
const http = require('http');
// Création du serveur HTTP avec l'application Express
const server = http.createServer(app);
// Importation de Socket.IO pour la communication bidirectionnelle
const { Server } = require('socket.io');
// Création de l'instance Socket.IO avec configuration CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000', // Autorisation des mêmes origines que l'API REST
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ],
    methods: ['GET', 'POST'] // Méthodes autorisées pour Socket.IO
  }
});
// Importation et initialisation du gestionnaire de sockets
const initializeSocket = require('./socketManager');
// Initialisation et récupération de la liste des utilisateurs en ligne
const onlineUsers = initializeSocket(io);
// Middleware pour exposer Socket.IO aux contrôleurs
app.use((req, res, next) => {
  req.io = io; // Instance Socket.IO disponible dans tous les contrôleurs
  req.onlineUsers = onlineUsers; // Liste des utilisateurs connectés
  next();
});
// ========== FIN INTÉGRATION SOCKET.IO ==========

// ========== CONFIGURATION DES ROUTES API ==========
// Route d'authentification (inscription, connexion, profil)
app.use('/api/auth', require('./routes/authRoutes'));
// Route de gestion des publications
app.use('/api/posts', require('./routes/postRoutes'));
// Route de gestion des utilisateurs
app.use('/api/users', require('./routes/userRoutes'));
// Route de gestion des notifications
app.use('/api/notifications', require('./routes/notificationRoutes'));
// Route de gestion des messages privés
app.use('/api/messages', require('./routes/messageRoutes'));
// Route de gestion des groupes
app.use('/api/groups', require('./routes/groupRoutes'));
// Route d'administration (réservée aux admins)
app.use('/api/admin', require('./routes/adminRoutes'));

// Route de test pour vérifier le bon fonctionnement du serveur
app.get('/api/test', (req, res) => {
  // Retourne un message de confirmation avec timestamp
  res.json({ success: true, message: 'Backend connecté à MongoDB', timestamp: new Date().toISOString() });
});

// ========== GESTION GLOBALE DES ERREURS ==========
// Importation et utilisation du middleware de gestion d'erreurs
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ========== DÉMARRAGE DU SERVEUR ==========
// Démarrage du serveur HTTP avec Socket.IO intégré
server.listen(PORT, () => {
  // Messages de confirmation du démarrage
  console.log(`🚀 Serveur CultureBook démarré sur http://localhost:${PORT}`);
  // console.log(`📁 Dossier uploads: ${uploadsDir}`);
});

// Export de l'application pour les tests ou autres utilisations
module.exports = app;
