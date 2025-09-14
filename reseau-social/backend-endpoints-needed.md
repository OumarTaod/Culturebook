# Endpoints Backend Requis pour les Groupes

## 1. Modèle Group (MongoDB)
```javascript
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});
```

## 2. Routes à ajouter dans le backend

### GET /api/groups
- Récupère tous les groupes
- Retourne: { success: true, data: [groups] }

### POST /api/groups
- Crée un nouveau groupe
- Body: { name, description }
- Retourne: { success: true, data: group }

### GET /api/groups/:id
- Récupère un groupe spécifique
- Retourne: { success: true, data: group }

### POST /api/groups/:id/join
- Rejoindre un groupe
- Retourne: { success: true, message: "Groupe rejoint" }

### DELETE /api/groups/:id/leave
- Quitter un groupe
- Retourne: { success: true, message: "Groupe quitté" }

### GET /api/groups/:id/members
- Récupère les membres d'un groupe
- Retourne: { success: true, data: [members] }

### POST /api/groups/:id/invite
- Inviter des membres
- Body: { userIds: [string] }
- Retourne: { success: true, message: "Invitations envoyées" }

### GET /api/groups/:id/posts
- Récupère les posts d'un groupe
- Retourne: { success: true, data: [posts] }

## 3. Modification du modèle Post
Ajouter le champ groupId au schéma Post existant :
```javascript
groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }
```

## 4. Endpoint contacts
### GET /api/users/contacts
- Récupère les abonnés/abonnements de l'utilisateur
- Retourne: { success: true, data: [contacts] }