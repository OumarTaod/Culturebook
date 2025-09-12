import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Post from '../components/Post';
import api from '../services/api';
import type { PostType, User } from '../types';
import Spinner from '../components/Spinner';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [startingConversation, setStartingConversation] = useState(false);

  const resolvedUserId = userId || currentUser?._id || '';
  const isOwnProfile = currentUser?._id === resolvedUserId;

  useEffect(() => {
    // Si aucun userId dans l'URL, mais on est connecté, rediriger vers son propre profil
    if (!userId && currentUser?._id) {
      navigate(`/profile/${currentUser._id}`, { replace: true });
      return;
    }
  }, [userId, currentUser, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!resolvedUserId) {
        setIsLoading(false);
        setError("Identifiant d'utilisateur manquant.");
        return;
      }
      try {
        const [userResponse, postsResponse] = await Promise.all([
          api.get(`/users/${resolvedUserId}`),
          api.get(`/users/${resolvedUserId}/posts`),
        ]);

        const userData = userResponse.data?.data || userResponse.data;
        setProfileUser(userData);
        setBio(userData?.bio || '');

        const postsData = postsResponse.data?.data || postsResponse.data;
        setUserPosts(postsData || []);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Impossible de charger les informations du profil';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [resolvedUserId]);

  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCover(e.target.files[0]);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();
      if (bio !== profileUser?.bio) {
        formData.append('bio', bio);
      }
      if (avatar) {
        formData.append('avatar', avatar);
      }
      if (cover) {
        formData.append('cover', cover);
      }

      const response = await api.patch(`/users/${resolvedUserId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updated = response.data?.data || response.data;
      setProfileUser(updated);
      setIsEditing(false);
      setAvatar(null);
      setCover(null);
    } catch (err) {
      setError('Impossible de mettre à jour le profil.');
    }
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const response = await api.patch(`/posts/${postId}/vote`);
      const updatedPost = response.data?.data || response.data;
      setUserPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (err) {}
  };

  const handleCommentSubmit = async (postId: string, content: string) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { content });
      const updatedPost = response.data?.data || response.data;
      setUserPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (err) {}
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!profileUser) {
    return <div className="error">Utilisateur non trouvé</div>;
  }

  const handleStartConversation = async () => {
    if (!profileUser || profileUser._id === currentUser?._id) return;
    try {
      setStartingConversation(true);
      const res = await api.post(`/messages/conversations/with/${profileUser._id}`);
      const conversation = res.data?.data || res.data;
      navigate('/messages', { state: { openConversationId: conversation._id } });
    } catch (err) {
      setError("Impossible d'ouvrir la conversation");
    } finally {
      setStartingConversation(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-cover">
        <img
          src={profileUser.coverUrl || '/default-cover.jpg'}
          alt="Image de couverture"
          className="cover-image"
        />
        {isOwnProfile && (
          <label className="cover-upload">
            <input type="file" accept="image/*" onChange={handleCoverChange} hidden />
            📷 Modifier la couverture
          </label>
        )}
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={profileUser.avatarUrl || '/default-avatar.png'}
            alt={`Avatar de ${profileUser.name}`}
            className="avatar-image"
          />
          {isOwnProfile && (
            <label className="avatar-overlay">
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              📷
            </label>
          )}
        </div>
        <div className="profile-info">
          <h1>{profileUser.name}</h1>
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
          {isOwnProfile ? (
            <button
              onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))}
              className="edit-button"
            >
              {isEditing ? 'Enregistrer' : 'Modifier le profil'}
            </button>
          ) : (
            <button onClick={handleStartConversation} className="edit-button" disabled={startingConversation}>
              {startingConversation ? 'Ouverture…' : 'Message'}
            </button>
          )}
        </div>
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{profileUser.stats?.posts || 0}</span>
            <span className="stat-label">Publications</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profileUser.stats?.followers || 0}</span>
            <span className="stat-label">Abonnés</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profileUser.stats?.following || 0}</span>
            <span className="stat-label">Abonnements</span>
          </div>
        </div>
      </div>
      <div className="profile-posts">
        <h2>Publications</h2>
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <Post
              key={post._id}
              post={post}
              onLikeToggle={() => handleLikeToggle(post._id)}
              onCommentSubmit={(content: string) => handleCommentSubmit(post._id, content)}
            />
          ))
        ) : (
          <p className="no-posts">Aucune publication</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
