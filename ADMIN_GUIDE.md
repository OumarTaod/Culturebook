# Guide d'Administration - CultureBook

## Vue d'ensemble

L'interface d'administration de CultureBook permet aux administrateurs et super-administrateurs de gérer le site web, les utilisateurs et le contenu.

## Accès à l'Administration

### Prérequis
- Avoir un compte avec le rôle `admin` ou `superadmin`
- Être connecté au site

### Accès
1. Connectez-vous à votre compte
2. Cliquez sur le menu utilisateur (3 points) dans la navbar
3. Sélectionnez "Administration"
4. Vous serez redirigé vers `/admin`

## Fonctionnalités

### 1. Tableau de Bord
- **Statistiques en temps réel** :
  - Nombre total d'utilisateurs
  - Nombre total de posts
  - Nombre total de messages
  - Nouveaux utilisateurs aujourd'hui

### 2. Gestion des Utilisateurs
- **Liste complète** de tous les utilisateurs
- **Modification des rôles** :
  - `user` : Utilisateur standard
  - `admin` : Administrateur
  - `superadmin` : Super administrateur (seuls les superadmins peuvent attribuer ce rôle)
- **Suppression d'utilisateurs** avec confirmation
- **Informations affichées** :
  - Nom et email
  - Rôle actuel
  - Nombre d'abonnés
  - Date d'inscription

### 3. Gestion des Posts
- **Liste des posts** récents (50 derniers)
- **Aperçu du contenu** (150 premiers caractères)
- **Statistiques** : likes et commentaires
- **Suppression de posts** avec confirmation
- **Informations affichées** :
  - Auteur du post
  - Date de publication
  - Contenu (aperçu)
  - Engagement (likes/commentaires)

## Permissions et Sécurité

### Rôles et Permissions

#### Super Administrateur (`superadmin`)
- **Toutes les permissions**
- Peut créer/modifier/supprimer des admins
- Peut créer d'autres super administrateurs
- Peut supprimer n'importe quel utilisateur
- Peut supprimer n'importe quel post

#### Administrateur (`admin`)
- Peut gérer les utilisateurs standards
- **Ne peut pas** modifier/supprimer d'autres admins ou super admins
- Peut supprimer des posts
- Peut voir toutes les statistiques

#### Utilisateur (`user`)
- **Aucun accès** à l'interface d'administration

### Sécurité
- **Authentification requise** : Seuls les utilisateurs connectés peuvent accéder
- **Autorisation par rôle** : Vérification côté serveur et client
- **Confirmations** : Toutes les actions destructives nécessitent une confirmation
- **Logs d'activité** : Les actions d'administration sont tracées

## Création d'un Administrateur

### Via Script (Recommandé)
```bash
cd backend
node scripts/createAdmin.js --name "Admin Name" --email "admin@example.com" --password "securepassword" --role "admin"
```

### Pour un Super Administrateur
```bash
node scripts/createAdmin.js --name "Super Admin" --email "superadmin@example.com" --password "securepassword" --role "superadmin"
```

## Interface Utilisateur

### Design
- **Responsive** : Fonctionne sur tous les appareils
- **Moderne** : Interface claire et intuitive
- **Accessible** : Navigation au clavier et lecteurs d'écran
- **Thème cohérent** : S'intègre avec le design du site

### Navigation
- **Onglets** : Tableau de bord, Utilisateurs, Posts
- **Retour facile** : Lien vers le site principal dans la navbar
- **Indicateurs visuels** : Statuts et confirmations claires

## API Endpoints

### Statistiques
- `GET /api/admin/stats` - Récupère les statistiques du site

### Utilisateurs
- `GET /api/admin/users` - Liste tous les utilisateurs
- `PATCH /api/admin/users/:id/role` - Modifie le rôle d'un utilisateur
- `DELETE /api/admin/users/:id` - Supprime un utilisateur

### Posts
- `GET /api/admin/posts` - Liste les posts récents
- `DELETE /api/admin/posts/:id` - Supprime un post

## Bonnes Pratiques

### Sécurité
1. **Changez les mots de passe par défaut**
2. **Limitez le nombre de super administrateurs**
3. **Vérifiez régulièrement les logs**
4. **Sauvegardez avant les suppressions importantes**

### Gestion
1. **Communiquez avec les utilisateurs** avant suppression
2. **Documentez les actions importantes**
3. **Surveillez les statistiques régulièrement**
4. **Formez les nouveaux administrateurs**

## Dépannage

### Problèmes Courants

#### "Accès refusé"
- Vérifiez que votre compte a le rôle `admin` ou `superadmin`
- Reconnectez-vous si nécessaire

#### "Erreur lors du chargement"
- Vérifiez la connexion réseau
- Vérifiez que le backend est démarré
- Consultez la console du navigateur pour les erreurs

#### "Impossible de modifier un utilisateur"
- Les admins ne peuvent pas modifier d'autres admins
- Seuls les super admins peuvent gérer tous les rôles

### Support
Pour toute question ou problème :
1. Consultez les logs du serveur
2. Vérifiez la console du navigateur
3. Contactez l'équipe technique

## Mise à Jour

L'interface d'administration est mise à jour automatiquement avec le site. Les nouvelles fonctionnalités incluront :
- Gestion des signalements
- Statistiques avancées
- Outils de modération
- Système de notifications admin

---

**Note** : Cette interface est réservée aux administrateurs. L'utilisation inappropriée peut entraîner la suspension du compte.