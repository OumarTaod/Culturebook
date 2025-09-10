const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const initializeSocket = require('./socketManager');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données (si pas en mode développement)
connectDB().catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    // En mode développement, continuer même si la connexion échoue
    if (process.env.NODE_ENV !== 'development') {
        process.exit(1);
    }
});

const app = express();

// Créer un serveur HTTP à partir de l'application Express
const server = http.createServer(app);

// Initialiser Socket.IO
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:5176'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Lancer le gestionnaire de sockets et récupérer la map des utilisateurs en ligne
const onlineUsers = initializeSocket(io);

// Middleware pour rendre io et onlineUsers accessibles dans les contrôleurs
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

// Middleware de base
// Middleware pour parser le JSON des requêtes
app.use(express.json());

// Activer CORS - Permet à votre frontend d'appeler cette API
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:5176'],
    credentials: true
}));

// Définir les headers de sécurité HTTP avec Helmet
app.use(helmet());

// Configuration de Helmet pour permettre le chargement des médias
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Servir statiquement le dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Limiter le nombre de requêtes pour prévenir les attaques par force brute
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limite chaque IP à 100 requêtes par `window` (ici, par 10 minutes)
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

app.get('/', (req, res) => {
    res.send('API CultureBook est en cours d\'exécution...');
});

// Monter les routes
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Middleware de gestion des erreurs (doit être le dernier middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Lancer le serveur HTTP (qui inclut Express et Socket.IO)
// En mode développement, utiliser un port différent pour éviter les conflits
const serverPort = process.env.NODE_ENV === 'development' ? 5001 : PORT;
server.listen(serverPort, () => console.log(`Serveur démarré sur le port ${serverPort} en mode ${process.env.NODE_ENV}`));