# CultureBook – Monorepo (Frontend + Backend)

Application complète du réseau social CultureBook.

- Frontend: React + Vite + TypeScript (`reseau-social/`)
- Backend: Node.js + Express + MongoDB + Socket.IO (`reseau-social/backend/`)

## Prérequis
- Node.js LTS (>= 18 recommandé)
- MongoDB en local (ou URI cloud)

## Installation rapide
```bash
# Backend
cd reseau-social/backend
npm install
cp .env.example .env
# Éditez .env et ajustez MONGO_URI et JWT_SECRET si besoin

# Frontend (dans un autre terminal)
cd reseau-social
npm install
cp .env.example .env
```

## Configuration (.env)

Backend `reseau-social/backend/.env`:
```
NODE_ENV=production
PORT=5050
MONGO_URI=mongodb://localhost:27017/culturebook
JWT_SECRET=remplacez_par_une_chaine_longue_et_secrete
```

Frontend `reseau-social/.env`:
```
VITE_API_BASE_URL=http://localhost:5050/api
VITE_API_URL=http://localhost:5050
```

## Lancement
```bash
# Backend (port 5050)
cd reseau-social/backend
npm start

# Frontend (port Vite ~5173)
cd reseau-social
npm run dev
```

Backend disponible sur `http://localhost:5050`, Frontend sur l’URL affichée par Vite (ex. `http://localhost:5173`).

## Fonctionnalités principales
- Authentification (inscription, connexion, profil via `GET /api/auth/profile`)
- Fil d’actualité: posts (texte + média image/vidéo/audio), likes, commentaires
- Notifications (lecture, marquer comme lues)
- Messagerie en temps réel via Socket.IO

## Endpoints consommés par le frontend
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`
- Posts: `GET /posts`, `POST /posts`, `PATCH /posts/:id/vote`, `GET|POST /posts/:id/comments`
- Notifications: `GET /notifications`, `PATCH /notifications/read`
- Messages: `GET /messages/conversations`, `GET /messages/:otherUserId`, `POST /messages`

## Script admin (optionnel)
Un script `scripts/createAdmin.js` peut exister côté backend. Si besoin, documentez son usage ici, par ex.:
```bash
cd reseau-social/backend
node scripts/createAdmin.js
```

## Dépannage
- 401 sur routes protégées: vérifiez le token (localStorage) et `JWT_SECRET`
- Erreurs Mongo: assurez `MONGO_URI` et que MongoDB est démarré
- Médias: le backend sert `/uploads` statiquement; les URL doivent pointer vers `/uploads/...`
- Socket.IO: vérifiez `VITE_API_URL` et que le backend écoute sur `5050`
