# 📚 DOCUMENTATION COMPLÈTE - CULTUREBOOK

## 🎯 Vue d'ensemble du projet

**CultureBook** est un réseau social moderne axé sur le partage culturel et l'échange interculturel. L'application permet aux utilisateurs de partager des publications, de suivre d'autres utilisateurs, de créer des groupes, et d'échanger via un système de messagerie en temps réel.

## 🏗️ Architecture du projet

### Structure des dossiers
```
Recyclage/
├── backend/                 # API Node.js + Express + MongoDB
│   ├── controllers/         # Logique métier des routes
│   ├── models/             # Modèles de données MongoDB
│   ├── routes/             # Définition des routes API
│   ├── middleware/         # Middlewares (auth, validation, etc.)
│   ├── utils/              # Utilitaires et helpers
│   ├── uploads/            # Stockage des fichiers uploadés
│   └── server.js           # Point d'entrée du serveur
├── reseau-social/          # Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Composants React réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── auth/           # Système d'authentification
│   │   ├── services/       # Services API et utilitaires
│   │   └── assets/         # Ressources statiques
│   └── public/             # Fichiers publics
└── DOCUMENTATION.md        # Ce fichier
```

## 🔧 Technologies utilisées

### Backend
- **Node.js** - Runtime JavaScript côté serveur
- **Express.js** - Framework web minimaliste
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **Socket.IO** - Communication temps réel
- **JWT** - Authentification par tokens
- **bcrypt** - Cryptage des mots de passe
- **Multer** - Upload de fichiers

### Frontend
- **React 18** - Librairie UI avec hooks
- **TypeScript** - JavaScript typé
- **Vite** - Build tool moderne et rapide
- **React Router** - Routage côté client
- **Axios** - Client HTTP pour les API calls
- **Socket.IO Client** - Communication temps réel

## 🚀 Fonctionnalités principales

### 👤 Système d'utilisateurs
- **Inscription/Connexion** - Authentification sécurisée avec JWT
- **Profils utilisateurs** - Avatar, bio, photos de couverture
- **Système de suivi** - Followers/Following
- **Rôles** - User, Admin, SuperAdmin avec permissions

### 📝 Publications
- **Création de posts** - Texte, images et audio
- **Interactions** - Likes, commentaires, partages
- **Sauvegarde** - Système de favoris
- **Modération** - Signalement et suppression

### 💬 Messagerie
- **Messages privés** - Communication 1-to-1
- **Temps réel** - Via Socket.IO
- **Notifications** - Alertes en temps réel

### 👥 Groupes
- **Création de groupes** - Communautés thématiques
- **Gestion des membres** - Invitations, modération
- **Publications de groupe** - Contenu spécifique

### 🛡️ Administration
- **Dashboard admin** - Statistiques et métriques
- **Gestion utilisateurs** - Bannissement, changement de rôles
- **Modération contenu** - Suppression de posts/commentaires
- **Signalements** - Traitement des rapports utilisateurs

## 📱 Responsive Design

L'application est entièrement responsive avec :
- **Mobile-first** - Conception prioritaire mobile
- **Breakpoints** - 480px, 768px, 1024px, 1200px+
- **Navigation mobile** - Barre de navigation en bas
- **Touch-friendly** - Tailles tactiles optimisées (44px min)
- **Performance** - Optimisations pour tous les appareils

## 🔐 Sécurité

### Authentification
- **JWT Tokens** - Durée de vie adaptée au rôle
- **Refresh tokens** - Renouvellement automatique
- **Middleware de protection** - Vérification sur toutes les routes sensibles

### Données
- **Validation** - Côté client et serveur
- **Sanitisation** - Nettoyage des inputs
- **Cryptage** - Mots de passe avec bcrypt (salt 10)
- **CORS** - Configuration stricte des origines

### Permissions
- **Contrôle d'accès** - Basé sur les rôles
- **Routes protégées** - Admin/SuperAdmin uniquement
- **Validation métier** - Règles de gestion respectées

## 🎨 Design System

### Variables CSS
- **Couleurs** - Palette cohérente avec thème sombre/clair
- **Typographie** - Système de tailles et poids
- **Espacements** - Grille d'espacement harmonieuse
- **Rayons** - Border-radius standardisés
- **Ombres** - Système d'élévation

### Composants
- **Boutons** - Variants (primary, secondary, danger)
- **Cards** - Conteneurs avec élévation
- **Inputs** - Formulaires cohérents
- **Navigation** - Desktop et mobile

## 📊 Base de données

### Modèles principaux
- **User** - Utilisateurs avec profils et relations
- **Post** - Publications avec médias et interactions
- **Comment** - Commentaires liés aux posts
- **Message** - Messages privés entre utilisateurs
- **Notification** - Système de notifications
- **Group** - Groupes avec membres et permissions

### Relations
- **User ↔ User** - Following/Followers (Many-to-Many)
- **User → Posts** - Un utilisateur a plusieurs posts (One-to-Many)
- **Post → Comments** - Un post a plusieurs commentaires (One-to-Many)
- **User ↔ Groups** - Appartenance aux groupes (Many-to-Many)

## 🔄 API Endpoints

### Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `GET /profile` - Profil utilisateur
- `POST /refresh` - Renouvellement token

### Publications (`/api/posts`)
- `GET /` - Liste des posts
- `POST /` - Création de post
- `PUT /:id` - Modification de post
- `DELETE /:id` - Suppression de post
- `POST /:id/like` - Like/Unlike
- `POST /:id/comment` - Ajout commentaire

### Utilisateurs (`/api/users`)
- `GET /:id` - Profil utilisateur
- `PUT /:id` - Mise à jour profil
- `POST /:id/follow` - Suivre/Ne plus suivre
- `GET /:id/followers` - Liste des abonnés
- `GET /:id/following` - Liste des abonnements

### Administration (`/api/admin`)
- `GET /stats` - Statistiques générales
- `GET /users` - Liste des utilisateurs
- `PATCH /users/:id/role` - Changement de rôle
- `PATCH /users/:id/ban` - Bannissement
- `DELETE /users/:id` - Suppression utilisateur

## 🚀 Déploiement

### Prérequis
- Node.js 18+
- MongoDB 5.0+
- npm ou yarn

### Installation
```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configurer les variables
npm start

# Frontend
cd reseau-social
npm install
npm run dev
```

### Variables d'environnement
```env
# Backend (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/culturebook
JWT_SECRET=your-secret-key
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Tests et qualité

### Bonnes pratiques
- **Code commenté** - Documentation inline complète
- **Nommage cohérent** - Conventions respectées
- **Structure modulaire** - Séparation des responsabilités
- **Gestion d'erreurs** - Try/catch et middleware global
- **Validation** - Côté client et serveur

### Performance
- **Lazy loading** - Chargement à la demande
- **Optimisation images** - Compression et formats adaptés
- **Mise en cache** - Stratégies de cache appropriées
- **Bundle splitting** - Code splitting avec Vite

## 📈 Évolutions futures

### Fonctionnalités prévues
- **Stories** - Publications éphémères
- **Live streaming** - Diffusion en direct
- **Marketplace avancé** - E-commerce intégré
- **IA de recommandation** - Contenu personnalisé
- **Multi-langues** - Internationalisation complète

### Améliorations techniques
- **Tests automatisés** - Jest + React Testing Library
- **CI/CD** - Pipeline de déploiement automatique
- **Monitoring** - Logs et métriques de performance
- **PWA** - Application web progressive
- **Microservices** - Architecture distribuée

## 👥 Équipe et contributions

### Structure du code
- **Commentaires** - Chaque fonction et composant documenté
- **Types TypeScript** - Typage strict côté frontend
- **Validation** - Schémas de validation Mongoose
- **Middleware** - Logique réutilisable centralisée

### Conventions
- **Nommage** - camelCase JS, kebab-case CSS
- **Fichiers** - PascalCase pour composants React
- **Commits** - Messages descriptifs et atomiques
- **Branches** - Feature branches avec PR reviews

---

*Cette documentation est maintenue à jour avec l'évolution du projet. Pour toute question ou contribution, consultez l'équipe de développement.*

























cd "c:\Users\Oumar diallo\Desktop\DossierSimplon\Recyle1\Recyclage\backend" && node scripts/createAdmin.js --name "Super Admin" --email "superadmin@culturebook.gn" --password "SuperAdmin2024!" --role superadmin
Compte superadmin créé: { email: 'superadmin@culturebook.gn', name: 'Super Admin' }