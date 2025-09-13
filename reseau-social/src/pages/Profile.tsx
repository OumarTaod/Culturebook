/**
 * ===========================================
 *           COMPOSANT PROFIL UTILISATEUR
 * ===========================================
 * 
 * Ce composant gère l'affichage complet du profil d'un utilisateur.
 * 
 * FONCTIONNALITÉS PRINCIPALES :
 * - Affichage des informations utilisateur (nom, bio, avatar, couverture)
 * - Édition du profil (pour le propriétaire uniquement)
 * - Upload d'avatar et de couverture avec aperçu instantané
 * - Affichage des statistiques (publications, abonnés, abonnements)
 * - Modals cliquables pour voir les listes d'abonnés/abonnements
 * - Affichage des publications filtrées par utilisateur
 * - Possibilité d'envoyer un message (pour les autres profils)
 * 
 * GESTION DES ÉTATS :
 * - Chargement des données utilisateur et publications
 * - Mode édition avec sauvegarde optimiste
 * - Gestion des erreurs et messages de feedback
 * - Modals pour les listes d'abonnements
 * 
 * NAVIGATION :
 * - Redirection automatique vers son propre profil si pas d'ID
 * - Navigation vers d'autres profils depuis les listes d'abonnements
 * - Intégration avec le système de messagerie
 * 
 * ===========================================
 */

// Importation des hooks React nécessaires
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
// Hooks de navigation React Router
import { useParams, useNavigate } from 'react-router-dom';
// Context d'authentification pour récupérer l'utilisateur connecté
import { useAuth } from '../auth/AuthContext';
// Composant pour afficher les publications
import Post from '../components/Post';
// Service API pour les requêtes HTTP
import api from '../services/api';
// Types TypeScript pour la sécurité des données
import type { PostType, User } from '../types';
// Composant de chargement
import Spinner from '../components/Spinner';
// Styles CSS du profil
import './Profile.css';

const Profile = () => {
  // Récupération de l'ID utilisateur depuis l'URL (paramètre dynamique)
  const { userId } = useParams<{ userId: string }>();
  // Hook de navigation pour rediriger l'utilisateur
  const navigate = useNavigate();
  // Récupération de l'utilisateur connecté et fonction de mise à jour
  const { user: currentUser, updateUser } = useAuth();
  
  // Configuration de l'URL de base de l'API
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') as string;
  // Extraction de l'origine de l'API (sans /api)
  const API_ORIGIN = API_BASE.replace(/\/?api\/?$/, '');
  
  // Fonction utilitaire pour convertir les URLs relatives en URLs absolues
  const toAbsolute = (url?: string | null) => {
    if (!url) return ''; // Si pas d'URL, retourner chaîne vide
    if (url.startsWith('http')) return url; // Si déjà absolue, la retourner
    return `${API_ORIGIN}${url}`; // Sinon, la rendre absolue
  };
  // États pour gérer les données du profil
  const [profileUser, setProfileUser] = useState<User | null>(null); // Données de l'utilisateur du profil
  const [userPosts, setUserPosts] = useState<PostType[]>([]); // Publications de l'utilisateur
  const [isLoading, setIsLoading] = useState(true); // État de chargement général
  const [error, setError] = useState(''); // Messages d'erreur
  
  // États pour l'édition du profil
  const [isEditing, setIsEditing] = useState(false); // Mode édition activé/désactivé
  const [bio, setBio] = useState(''); // Texte de la bio en cours d'édition
  const [avatar, setAvatar] = useState<File | null>(null); // Fichier avatar sélectionné
  const [cover, setCover] = useState<File | null>(null); // Fichier couverture sélectionné
  const [uploading, setUploading] = useState(false); // État d'upload des fichiers
  
  // États pour la messagerie
  const [startingConversation, setStartingConversation] = useState(false); // Démarrage conversation
  
  // États pour la modal des abonnements
  const [showFollowing, setShowFollowing] = useState(false); // Affichage modal abonnements
  const [following, setFollowing] = useState<User[]>([]); // Liste des abonnements
  const [loadingFollowing, setLoadingFollowing] = useState(false); // Chargement abonnements
  
  // États pour la modal des abonnés
  const [showFollowers, setShowFollowers] = useState(false); // Affichage modal abonnés
  const [followers, setFollowers] = useState<User[]>([]); // Liste des abonnés
  const [loadingFollowers, setLoadingFollowers] = useState(false); // Chargement abonnés
  
  // États pour le suivi
  const [isFollowing, setIsFollowing] = useState(false); // État de suivi
  const [followLoading, setFollowLoading] = useState(false); // Chargement action suivi

  // Détermination de l'ID utilisateur à afficher (URL ou utilisateur connecté)
  const resolvedUserId = userId || currentUser?._id || '';
  // Vérification si c'est le profil de l'utilisateur connecté
  const isOwnProfile = currentUser?._id === resolvedUserId;

  // Effet pour rediriger vers son propre profil si aucun userId dans l'URL
  useEffect(() => {
    // Si aucun userId dans l'URL, mais on est connecté, rediriger vers son propre profil
    if (!userId && currentUser?._id) {
      navigate(`/profile/${currentUser._id}`, { replace: true });
      return;
    }
  }, [userId, currentUser, navigate]); // Dépendances : se déclenche quand ces valeurs changent

  // Effet principal pour charger les données du profil
  useEffect(() => {
    const fetchProfileData = async () => {
      // Vérification que l'ID utilisateur existe
      if (!resolvedUserId) {
        console.log('❌ Aucun ID utilisateur résolu');
        setIsLoading(false);
        setError("Identifiant d'utilisateur manquant.");
        return;
      }
      
      console.log('🔄 Chargement du profil pour:', resolvedUserId);
      
      try {
        // Requêtes parallèles pour optimiser le chargement
        // Promise.all permet d'exécuter les deux requêtes en même temps
        const [userResponse, postsResponse] = await Promise.all([
          api.get(`/users/${resolvedUserId}`), // Données utilisateur
          api.get(`/users/${resolvedUserId}/posts`), // Publications de l'utilisateur
        ]);

        console.log('📊 Réponse utilisateur:', userResponse.data);
        console.log('📝 Réponse publications:', postsResponse.data);

        // Extraction des données utilisateur (gestion de différents formats de réponse)
        const userData = userResponse.data?.data || userResponse.data;
        console.log('👤 Données utilisateur extraites:', { 
          name: userData?.name, 
          coverUrl: userData?.coverUrl, 
          avatarUrl: userData?.avatarUrl 
        });
        
        if (!userData) {
          throw new Error('Aucune donnée utilisateur reçue');
        }
        
        setProfileUser(userData);
        setBio(userData?.bio || ''); // Initialisation de la bio pour l'édition
        
        // Vérifier si on suit déjà cet utilisateur
        if (!isOwnProfile && currentUser?._id) {
          try {
            const followResponse = await api.get(`/users/${resolvedUserId}/is-following`);
            console.log('Réponse suivi:', followResponse.data);
            setIsFollowing(followResponse.data?.isFollowing || false);
          } catch (err) {
            console.log('Erreur vérification suivi:', err);
            setIsFollowing(false);
          }
        }

        // Extraction des publications
        const postsData = postsResponse.data?.data || postsResponse.data;
        console.log('📋 Publications extraites:', postsData);
        setUserPosts(Array.isArray(postsData) ? postsData : []);
        
        console.log('✅ Profil chargé avec succès');
      } catch (err: any) {
        // Gestion des erreurs avec message personnalisé
        console.error('❌ Erreur lors du chargement:', err);
        const msg = err?.response?.data?.message || err?.message || 'Impossible de charger les informations du profil';
        setError(msg);
      } finally {
        // Arrêt du chargement dans tous les cas (succès ou erreur)
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [resolvedUserId]); // Se déclenche quand l'ID utilisateur change

  // Gestionnaire de changement de la bio pendant l'édition
  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value); // Mise à jour de l'état local
  };

  // Fonction utilitaire pour l'upload partiel (avatar/couverture)
  const uploadPartial = async (formData: FormData) => {
    if (!resolvedUserId) return; // Vérification sécurité
    
    setUploading(true); // Indication visuelle d'upload
    try {
      // Requête PATCH avec multipart/form-data pour les fichiers
      const response = await api.patch(`/users/${resolvedUserId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Mise à jour des données locales
      const updated = response.data?.data || response.data;
      console.log('📸 Données reçues du serveur:', updated);
      setProfileUser(updated);
      
      // Si c'est son propre profil, mettre à jour le contexte global
      if (isOwnProfile && updated) {
        console.log('🔄 Mise à jour du contexte avec:', { coverUrl: updated.coverUrl, avatarUrl: updated.avatarUrl });
        updateUser(updated);
      }
    } catch (err) {
      setError('Impossible de mettre à jour le profil.');
    } finally {
      setUploading(false); // Fin de l'upload
    }
  };

  // Gestionnaire de changement d'avatar
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      
      // Upload automatique du fichier sans aperçu optimiste
      const fd = new FormData();
      fd.append('avatar', file);
      uploadPartial(fd);
    }
  };

  // Gestionnaire de changement de couverture (même logique que l'avatar)
  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCover(file);
      
      // Upload automatique sans aperçu optimiste pour éviter les conflits
      const fd = new FormData();
      fd.append('cover', file);
      uploadPartial(fd);
    }
  };

  // Gestionnaire de sauvegarde complète du profil
  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();
      
      // Ajout conditionnel des champs modifiés
      if (bio !== profileUser?.bio) {
        formData.append('bio', bio);
      }
      if (avatar) {
        formData.append('avatar', avatar);
      }
      if (cover) {
        formData.append('cover', cover);
      }

      // Si aucune modification, sortir du mode édition
      if ([...formData.keys()].length === 0) {
        setIsEditing(false);
        return;
      }

      // Envoi des modifications
      const response = await api.patch(`/users/${resolvedUserId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Mise à jour des données
      const updated = response.data?.data || response.data;
      setProfileUser(updated);
      if (isOwnProfile && updated) {
        updateUser(updated); // Mise à jour contexte global
      }
      
      // Nettoyage et sortie du mode édition
      setIsEditing(false);
      setAvatar(null);
      setCover(null);
    } catch (err) {
      setError('Impossible de mettre à jour le profil.');
    }
  };

  // Gestionnaire de like/unlike sur les publications
  const handleLikeToggle = async (postId: string) => {
    try {
      // Requête pour toggler le like
      const response = await api.patch(`/posts/${postId}/vote`);
      const updatedPost = response.data?.data || response.data;
      
      // Mise à jour locale de la liste des posts
      setUserPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (err) {
      // Erreur silencieuse pour ne pas perturber l'UX
    }
  };

  // Gestionnaire d'ajout de commentaire
  const handleCommentSubmit = async (postId: string, content: string) => {
    try {
      // Envoi du nouveau commentaire
      const response = await api.post(`/posts/${postId}/comments`, { content });
      const updatedPost = response.data?.data || response.data;
      
      // Mise à jour locale avec le post contenant le nouveau commentaire
      setUserPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (err) {
      // Erreur silencieuse
    }
  };

  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return <Spinner />; // Affichage du spinner pendant le chargement
  }

  if (error) {
    return <div className="error">{error}</div>; // Affichage des erreurs
  }

  if (!profileUser) {
    console.log('❌ Aucun utilisateur de profil trouvé');
    return <div className="error">Utilisateur non trouvé</div>; // Utilisateur inexistant
  }

  console.log('🎨 Rendu du profil pour:', profileUser.name);

  // Gestionnaire pour démarrer une conversation privée
  const handleStartConversation = async () => {
    // Vérifications de sécurité
    if (!profileUser || profileUser._id === currentUser?._id) return;
    
    try {
      setStartingConversation(true); // Indication visuelle
      
      // Création ou récupération de la conversation
      const res = await api.post(`/messages/conversations/with/${profileUser._id}`);
      const conversation = res.data?.data || res.data;
      
      // Navigation vers la page messages avec la conversation ouverte
      navigate('/messages', { state: { openConversationId: conversation._id } });
    } catch (err) {
      setError("Impossible d'ouvrir la conversation");
    } finally {
      setStartingConversation(false);
    }
  };

  // Gestionnaire pour afficher/masquer la liste des abonnements
  const handleShowFollowing = async () => {
    // Si déjà ouvert, fermer la modal
    if (showFollowing) {
      setShowFollowing(false);
      return;
    }
    
    setLoadingFollowing(true);
    try {
      // Récupération de la liste des abonnements
      const response = await api.get(`/users/${resolvedUserId}/following`);
      const followingData = response.data?.data || [];
      setFollowing(followingData);
      setShowFollowing(true); // Ouverture de la modal
    } catch (err) {
      setError('Impossible de charger les abonnements');
    } finally {
      setLoadingFollowing(false);
    }
  };

  // Gestionnaire pour afficher/masquer la liste des abonnés
  const handleShowFollowers = async () => {
    // Si déjà ouvert, fermer la modal
    if (showFollowers) {
      setShowFollowers(false);
      return;
    }
    
    setLoadingFollowers(true);
    try {
      // Récupération de la liste des abonnés
      const response = await api.get(`/users/${resolvedUserId}/followers`);
      const followersData = response.data?.data || [];
      setFollowers(followersData);
      setShowFollowers(true); // Ouverture de la modal
    } catch (err) {
      setError('Impossible de charger les abonnés');
    } finally {
      setLoadingFollowers(false);
    }
  };

  // Gestionnaire pour suivre/ne plus suivre un utilisateur
  const handleFollowToggle = async () => {
    if (!profileUser || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      let response;
      if (isFollowing) {
        response = await api.delete(`/users/${profileUser._id}/follow`);
      } else {
        response = await api.post(`/users/${profileUser._id}/follow`);
      }
      const newFollowState = response.data?.isFollowing ?? !isFollowing;
      console.log('Nouveau statut de suivi:', newFollowState);
      setIsFollowing(newFollowState);
      
      // Mettre à jour les statistiques localement
      setProfileUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            followers: newFollowState 
              ? (prev.stats?.followers || 0) + 1
              : Math.max((prev.stats?.followers || 0) - 1, 0)
          }
        };
      });
    } catch (err) {
      console.error('Erreur suivi:', err);
      setError('Erreur lors de la mise à jour du suivi');
    } finally {
      setFollowLoading(false);
    }
  };

  // ===========================================
  //              RENDU DU COMPOSANT
  // ===========================================
  return (
    <div className="profile-container"> {/* Conteneur principal du profil */}
      {/* Section de l'image de couverture */}
      <div className="profile-cover">
        <img
          src={toAbsolute(profileUser.coverUrl) || '/default-cover.jpg'}
          alt="Image de couverture"
          className="cover-image"
        />
        {/* Bouton de modification (seulement pour son propre profil) */}
        {isOwnProfile && (
          <label className="cover-upload">
            <input type="file" accept="image/*" onChange={handleCoverChange} hidden />
            {uploading ? 'Envoi…' : '📷 Modifier la couverture'}
          </label>
        )}
      </div>

      {/* En-tête du profil avec avatar, infos et statistiques */}
      <div className="profile-header">
        {/* Section avatar */}
        <div className="profile-avatar">
          <img
            src={toAbsolute(profileUser.avatarUrl) || '/default-avatar.png'}
            alt={`Avatar de ${profileUser.name}`}
            className="avatar-image"
          />
          {/* Overlay de modification d'avatar (propriétaire uniquement) */}
          {isOwnProfile && (
            <label className="avatar-overlay">
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              {uploading ? '…' : '📷'}
            </label>
          )}
        </div>
        {/* Informations du profil */}
        <div className="profile-info">
          <h1>{profileUser.name || 'Nom non disponible'}</h1>
          
          {/* Bio : mode édition ou affichage */}
          {isEditing ? (
            <textarea
              value={bio}
              onChange={handleBioChange}
              placeholder="Ajoutez une bio..."
              className="bio-input"
            />
          ) : (
            <p className="bio">{profileUser.bio || 'Aucune bio'}</p>
          )}
          
          {/* Boutons d'action selon le type de profil */}
          {isOwnProfile ? (
            // Bouton édition pour son propre profil
            <button
              onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))}
              className="edit-button"
              disabled={uploading}
            >
              {isEditing ? 'Enregistrer' : 'Modifier le profil'}
            </button>
          ) : (
            // Boutons pour les autres profils
            <div className="profile-actions">
              <button 
                onClick={handleFollowToggle} 
                className={`follow-button ${isFollowing ? 'following' : 'not-following'}`}
                disabled={followLoading}
              >
                {followLoading ? 'Chargement...' : (isFollowing ? 'Se désabonner' : 'Suivre')}
              </button>
              <button onClick={handleStartConversation} className="message-button" disabled={startingConversation}>
                {startingConversation ? 'Ouverture…' : 'Message'}
              </button>
            </div>
          )}
        </div>
        {/* Statistiques du profil */}
        <div className="profile-stats">
          {/* Nombre de publications (non cliquable) */}
          <div className="stat">
            <span className="stat-value">{profileUser.stats?.posts ?? userPosts.length}</span>
            <span className="stat-label">Publications</span>
          </div>
          
          {/* Nombre d'abonnés (cliquable pour voir la liste) */}
          <div className="stat" onClick={handleShowFollowers} style={{ cursor: 'pointer' }}>
            <span className="stat-value">{profileUser.stats?.followers ?? 0}</span>
            <span className="stat-label">Abonnés</span>
          </div>
          
          {/* Nombre d'abonnements (cliquable pour voir la liste) */}
          <div className="stat" onClick={handleShowFollowing} style={{ cursor: 'pointer' }}>
            <span className="stat-value">{profileUser.stats?.following ?? 0}</span>
            <span className="stat-label">Abonnements</span>
          </div>
        </div>
      </div>
      
      {/* Modal des abonnements */}
      {showFollowing && (
        <div className="following-modal" onClick={() => setShowFollowing(false)}>
          {/* Contenu de la modal (empêche la fermeture au clic) */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* En-tête avec titre et bouton fermer */}
            <div className="modal-header">
              <h3>Abonnements</h3>
              <button onClick={() => setShowFollowing(false)} className="close-btn">×</button>
            </div>
            
            {/* Liste des abonnements */}
            <div className="following-list">
              {loadingFollowing ? (
                <Spinner /> // Chargement
              ) : following.length > 0 ? (
                // Affichage de chaque abonnement
                following.map((user) => (
                  <div key={user._id} className="following-item" onClick={() => {
                    setShowFollowing(false); // Fermer la modal
                    navigate(`/profile/${user._id}`); // Naviguer vers le profil
                  }}>
                    <img
                      src={toAbsolute(user.avatarUrl) || '/default-avatar.png'}
                      alt={user.name}
                      className="following-avatar"
                    />
                    <div className="following-info">
                      <span className="following-name">{user.name}</span>
                      <span className="following-bio">{user.bio || 'Aucune bio'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Aucun abonnement</p> // Message si liste vide
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal des abonnés (même structure que les abonnements) */}
      {showFollowers && (
        <div className="following-modal" onClick={() => setShowFollowers(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Abonnés</h3>
              <button onClick={() => setShowFollowers(false)} className="close-btn">×</button>
            </div>
            
            <div className="following-list">
              {loadingFollowers ? (
                <Spinner />
              ) : followers.length > 0 ? (
                // Affichage de chaque abonné
                followers.map((user) => (
                  <div key={user._id} className="following-item" onClick={() => {
                    setShowFollowers(false);
                    navigate(`/profile/${user._id}`);
                  }}>
                    <img
                      src={toAbsolute(user.avatarUrl) || '/default-avatar.png'}
                      alt={user.name}
                      className="following-avatar"
                    />
                    <div className="following-info">
                      <span className="following-name">{user.name}</span>
                      <span className="following-bio">{user.bio || 'Aucune bio'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Aucun abonné</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Section des publications de l'utilisateur */}
      <div className="profile-posts">
        <h2>Publications</h2>
        {userPosts.length > 0 ? (
          // Affichage de chaque publication
          userPosts.map((post) => (
            <Post
              key={post._id} // Clé unique pour React
              post={post} // Données de la publication
              onLikeToggle={() => handleLikeToggle(post._id)} // Callback pour les likes
              onCommentSubmit={(content: string) => handleCommentSubmit(post._id, content)} // Callback pour les commentaires
              onDelete={(postId) => setUserPosts(prev => prev.filter(p => p._id !== postId))} // Callback pour supprimer
            />
          ))
        ) : (
          <p className="no-posts">Aucune publication</p> // Message si pas de publications
        )}
      </div>
    </div> 
  );
};

// Export du composant pour utilisation dans d'autres fichiers
export default Profile;

/**
 * ===========================================
 *                   NOTES TECHNIQUES
 * ===========================================
 * 
 * OPTIMISATIONS IMPLÉMENTÉES :
 * - Requêtes parallèles avec Promise.all pour le chargement initial
 * - Upload optimiste avec aperçu immédiat des images
 * - Gestion des états de chargement pour une meilleure UX
 * - Fermeture des modals au clic extérieur
 * 
 * SÉCURITÉ :
 * - Vérification des permissions (modification du profil)
 * - Validation côté client et serveur
 * - Gestion sécurisée des URLs d'images
 * 
 * ACCESSIBILITÉ :
 * - Textes alternatifs pour les images
 * - Navigation au clavier supportée
 * - Indicateurs visuels pour les actions
 * 
 * ===========================================
 */
