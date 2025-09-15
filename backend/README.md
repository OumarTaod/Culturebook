# CultureBook - Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

Ce dépôt contient le code source du backend pour **CultureBook**. L'application permet aux utilisateurs de partager et découvrir la richesse culturelle à travers des proverbes, des contes et des histoires.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies Utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement](#lancement)
- [Documentation de l'API](#documentation-de-lapi)
- [Structure du Projet](#structure-du-projet)

## Fonctionnalités

- ✅ Authentification des utilisateurs (inscription, connexion) avec JWT.
- 📝 Création de publications (proverbes, contes, histoires) avec texte et audio.
- ❤️ Liker et unliker des publications.
- 💬 Commenter les publications.
- 📂 Upload de fichiers multimédias (audio, images).
- 🛡️ Routes protégées par middleware d'authentification.

## Technologies Utilisées

- **Node.js**: Environnement d'exécution JavaScript côté serveur.
- **Express.js**: Framework pour construire l'API REST.
- **MongoDB**: Base de données NoSQL pour stocker les données.
- **Mongoose**: ODM pour modéliser et interagir avec MongoDB.
- **JSON Web Token (JWT)**: Pour l'authentification et la sécurisation des routes.
- **bcrypt**: Pour le hachage et la sécurisation des mots de passe.
- **Multer**: Pour la gestion des uploads de fichiers.
- **dotenv**: Pour la gestion des variables d'environnement.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les logiciels suivants sur votre machine :
- [Node.js](https://nodejs.org/en/) (v16 ou supérieure)
- [MongoDB](https://www.mongodb.com/try/download/community)

## Installation

1.  Clonez le dépôt sur votre machine locale :
    ```bash
    git clone <>
    cd backend
    ```

2.  Installez les dépendances du projet :
    ```bash
    npm install
    ```

3.  Créez un fichier `.env` à la racine du dossier `backend` et copiez-y le contenu du fichier `.env.example` (ou ci-dessous).

4.  Remplissez les variables d'environnement dans le fichier `.env` :
    ```
    # .env

    # Port sur lequel le serveur va écouter
    PORT=5000

    # URI de connexion à votre base de données MongoDB
    MONGO_URI=mongodb://localhost:27017/culturebook

    # Clé secrète pour signer les tokens JWT (choisissez une chaîne de caractères longue et aléatoire)
    JWT_SECRET=Oumar_Taod_Le_Jeune_Programmeur_Le_Futur_Millionnaire_123_Oumarthekin
    ```

**Note importante** : Le fichier `.env` contient des informations sensibles et ne doit **jamais** être versionné avec Git. Le fichier `.gitignore` est déjà configuré pour l'ignorer.

## Lancement

Pour démarrer le serveur en mode développement (avec rechargement automatique grâce à `nodemon`) :

```bash
npm run dev
```

Le serveur sera accessible à l'adresse `http://localhost:5000`.

Pour un lancement en production :

```bash
npm start
```

## Documentation de l'API

Voici les principaux points d'accès (endpoints) de l'API.

### Authentification

*   **`POST /api/auth/register`**
    *   Description : Inscription d'un nouvel utilisateur.
    *   Accès : Public.
    *   Body : `{ "name": "Votre Nom", "email": "email@example.com", "password": "votre_mot_de_passe" }`

*   **`POST /api/auth/login`**
    *   Description : Connexion d'un utilisateur.
    *   Accès : Public.
    *   Body : `{ "email": "email@example.com", "password": "votre_mot_de_passe" }`
    *   Réponse : `{ "user": { ... }, "token": "votre_jwt_token" }`

### Publications (Posts)

*   **`GET /api/posts`**
    *   Description : Récupère la liste de toutes les publications.
    *   Accès : Public.

*   **`POST /api/posts`**
    *   Description : Crée une nouvelle publication.
    *   Accès : Privé (nécessite un token `Bearer`).
    *   Body (form-data) :
        *   `type`: 'Conte', 'Proverbe' ou 'Histoire'
        *   `language`: 'Soussou', 'Peul', etc.
        *   `region`: 'Basse-Guinée', etc.
        *   `textContent`: 'Le contenu du post...'
        *   `media`: (Optionnel) Fichier audio ou image.

*   **`PATCH /api/posts/:id/vote`**
    *   Description : Aime ou n'aime plus une publication.
    *   Accès : Privé (nécessite un token `Bearer`).
    *   Params : `id` de la publication.

*   **`POST /api/posts/:id/comments`**
    *   Description : Ajoute un commentaire à une publication.
    *   Accès : Privé (nécessite un token `Bearer`).
    *   Params : `id` de la publication.
    *   Body : `{ "content": "Contenu du commentaire" }`

*   **`GET /api/posts/:id/comments`**
    *   Description : Récupère les commentaires d'une publication.
    *   Accès : Public.
    *   Params : `id` de la publication.

## Structure du Projet

```
backend/
├── config/
│   └── db.js               # Configuration de la connexion à la base de données
├── controllers/
│   ├── authController.js   # Logique pour l'authentification
│   └── postController.js   # Logique pour les publications
├── middleware/
│   ├── authMiddleware.js   # Protège les routes avec JWT
│   ├── errorHandler.js     # Gère les erreurs
│   └── uploadMiddleware.js # Gère l'upload de fichiers avec Multer
├── models/
│   ├── User.js             # Modèle Mongoose pour les utilisateurs
│   ├── Post.js             # Modèle Mongoose pour les publications
│   └── Commentaire.js      # Modèle Mongoose pour les commentaires
├── routes/
│   ├── authRoutes.js       # Routes pour l'authentification
│   └── postRoutes.js       # Routes pour les publications
├── uploads/                # Dossier où les fichiers uploadés sont stockés
├── .env                    # Fichier des variables d'environnement (à créer)
├── .gitignore              # Fichiers et dossiers ignorés par Git
├── package.json            # Dépendances et scripts du projet
├── README.md               # Ce fichier
└── server.js               # Point d'entrée de l'application
```

---

Projet réalisé par **Oumar Diallo** pour la soutenance de Développeur Web.