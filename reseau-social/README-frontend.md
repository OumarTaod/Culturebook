# CultureBook – Frontend (Réseau social)

## Aperçu
Application frontend (React + Vite + TypeScript) pour le réseau social CultureBook. Elle consomme l'API backend (Express + MongoDB + Socket.IO) et propose:
- Authentification (inscription, connexion, persistance de session)
- Fil d'actualité (publication, like, commentaires)
- Notifications (like et commentaire) + temps réel via Socket.IO
- Messagerie (conversations et messages en temps réel via Socket.IO)

## Prérequis
- Node.js LTS
- Backend démarré sur http://localhost:5050 (ou définissez vos URL dans `.env`)

## Installation
```bash
cd reseau-social
npm install
```

## Configuration
Créer un fichier `.env` (déjà fourni) avec:
```
VITE_API_BASE_URL=http://localhost:5050/api
VITE_API_URL=http://localhost:5050
```
- `VITE_API_BASE_URL`: base URL pour les requêtes Axios (API REST)
- `VITE_API_URL`: URL de connexion Socket.IO

## Démarrer en développement
```bash
npm run dev
```
Vite affiche l’URL locale (p. ex. http://localhost:5173). Ouvrez-la dans votre navigateur.

## Structure principale
- `src/services/api.tsx`: instance Axios (intercepteurs, token)
- `src/services/socketService.ts`: wrapper Socket.IO (connect, sendMessage, events)
- `src/auth/AuthContext.tsx`: contexte d’auth (login/logout, validation de session via GET /auth/profile)
- `src/pages`:
  - `Login.tsx`: inscription/connexion
  - `Home.tsx`: fil d’actualité (chargement des posts, création, likes)
  - `Notifications.tsx`: affichage notifications, marquage comme lues
  - `Messages.tsx`: conversations et messages
- `src/components`:
  - `CreatePost.tsx`: formulaire de création de post (texte + média)
  - `Post.tsx`: carte post (contenu, likes, commentaires)
  - `Navbar.tsx`, `Layout.tsx`, `Spinner.tsx`

## Endpoints consommés
- Auth:
  - POST `/auth/register`
  - POST `/auth/login`
  - GET `/auth/profile` (valide la session)
- Posts:
  - GET `/posts` (liste des posts)
  - POST `/posts` (multipart/form-data: textContent, type, language, region, media?)
  - PATCH `/posts/:id/vote` (like/unlike)
  - GET `/posts/:id/comments` (liste de commentaires)
  - POST `/posts/:id/comments` (créer un commentaire)
- Notifications:
  - GET `/notifications` (liste)
  - PATCH `/notifications/read` (tout marquer lu)
  - PATCH `/notifications/:id/read` (marquer une notification – ajouté pour compatibilité)
- Messages:
  - GET `/messages/conversations` (liste des conversations)
  - GET `/messages/conversations/:conversationId` (messages de la conversation)
  - Socket.IO:
    - Auth via `auth.token`
    - `sendMessage`: { receiverId, content }
    - `newMessage`: payload = objet Message

## Notes d’intégration
- Les posts côté backend utilisent les champs: type, language, region, textContent, audioUrl.
- `CreatePost.tsx` envoie `textContent`, `type`, `language`, `region` (valeurs temporaires pour language/region, à remplacer par de vrais champs UI) et `media` (input file).
- `Post.tsx` rend l’audio via `audioUrl` et affiche `type · language · region`.
- Les notifications temps réel sont reçues côté backend via Socket.IO et mises à jour côté front par alert + refresh.
- Messagerie temps réel: l’envoi se fait avec `receiverId` (calculé à partir du participant opposé). À réception d’un `newMessage`, on met à jour la conversation et on recharge les messages si la conversation est ouverte.

## Scénarios de test
1. Inscription, connexion: `Login.tsx` -> redirection vers `/`.
2. Création de post: saisir un texte, choisir un type, joindre un média, publier -> le post apparaît.
3. Like: cliquer sur ❤️ -> compteur mis à jour, notification envoyée à l’auteur (si autre utilisateur).
4. Commentaires: ouvrir une carte post, ajouter un commentaire -> affiché, notification envoyée à l’auteur.
5. Notifications: ouvrir la page Notifications -> lister, marquer tout comme lu.
6. Messages: ouvrir la page Messages -> sélectionner une conversation -> envoyer un message -> réception en temps réel (sur l’autre compte connecté).

## Build
```bash
npm run build
npm run preview
```

## Dépannage
- 401 sur des routes protégées: vérifier le token dans localStorage; si expiré, reconnectez-vous.
- Média non lu: vérifier que backend sert `/uploads` statiquement et que `audioUrl` pointe vers `/uploads/...`.
- Socket.IO non connecté: vérifier VITE_API_URL et que le backend est démarré sur le bon port.
