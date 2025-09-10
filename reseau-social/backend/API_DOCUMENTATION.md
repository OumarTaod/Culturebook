# Documentation de l'API CultureBook

## Introduction
Cette API permet de gérer des utilisateurs, des posts et des votes pour une application de type réseau social.

---

## Authentification

### Inscription
- **URL** : `/api/auth/register`
- **Méthode** : POST
- **Body (JSON)** :
  ```json
  {
    "nom": "string",
    "email": "string",
    "motDePasse": "string"
  }
  ```
- **Réponse** :
  - 201 : Utilisateur créé, token JWT retourné
  - 400 : Email déjà utilisé

### Connexion
- **URL** : `/api/auth/login`
- **Méthode** : POST
- **Body (JSON)** :
  ```json
  {
    "email": "string",
    "motDePasse": "string"
  }
  ```
- **Réponse** :
  - 200 : Connexion réussie, token JWT retourné
  - 400/401 : Erreur d’identifiants

---

## Posts

### Créer un post
- **URL** : `/api/posts`
- **Méthode** : POST
- **Headers** :
  - `Authorization: Bearer <token>`
- **Body (JSON)** :
  ```json
  {
    "titre": "string",
    "contenu": "string"
  }
  ```
- **Réponse** :
  - 201 : Post créé
  - 401 : Non autorisé

### Récupérer tous les posts
- **URL** : `/api/posts`
- **Méthode** : GET
- **Réponse** :
  - 200 : Liste des posts

### Voter pour un post
- **URL** : `/api/posts/:id/vote`
- **Méthode** : PATCH
- **Headers** :
  - `Authorization: Bearer <token>`
- **Réponse** :
  - 200 : Vote pris en compte
  - 401 : Non autorisé

---

## Sécurité
- Utilise JWT pour l’authentification.
- Les routes protégées nécessitent le header `Authorization`.

---

## Erreurs courantes
- 400 : Requête invalide ou données manquantes
- 401 : Non autorisé (token manquant ou invalide)
- 404 : Ressource non trouvée
- 500 : Erreur serveur

---

## Exemple de requête avec curl
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","email":"test@example.com","motDePasse":"motdepasse"}'
```

---

## Auteur
Oumar Diallo
