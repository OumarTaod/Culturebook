import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import './Friends.css';

const Friends = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Charger les vraies données depuis l'API
      const [followingRes, followersRes, suggestionsRes] = await Promise.all([
        api.get(`/users/${user?._id}/following`),
        api.get(`/users/${user?._id}/followers`),
        api.get('/users/suggestions')
      ]);
      
      const followingData = followingRes.data?.data || [];
      const followersData = followersRes.data?.data || [];
      const suggestionsData = suggestionsRes.data?.data || [];
      
      // Ajouter le statut isFollowing aux suggestions
      const followingIds = followingData.map(u => u._id);
      const suggestionsWithStatus = suggestionsData.map(suggestion => ({
        ...suggestion,
        isFollowing: followingIds.includes(suggestion._id)
      }));
      
      setFollowing(followingData);
      setFollowers(followersData);
      setSuggestions(suggestionsWithStatus);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setFollowing([]);
      setFollowers([]);
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const userToFollow = suggestions.find(u => u._id === userId);
      if (!userToFollow) return;
      
      if (userToFollow.isFollowing) {
        await api.delete(`/users/${userId}/follow`);
        setFollowing(prev => prev.filter(u => u._id !== userId));
      } else {
        await api.post(`/users/${userId}/follow`);
        setFollowing(prev => [...prev, { ...userToFollow, isFollowing: true }]);
      }
      
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}/follow`);
      setFollowing(prev => prev.filter(u => u._id !== userId));
      
      // Mettre à jour les suggestions si l'utilisateur y est présent
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: false }
            : user
        )
      );
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>👥 Abonnements</h1>
        <p>Suivez vos conteurs préférés</p>
      </div>

      <div className="friends-sections">
        <div className="section">
          <h2>Mes abonnements ({following.length})</h2>
          <div className="friends-list">
            {following.length === 0 ? (
              <p className="empty-state">Vous ne suivez personne pour le moment</p>
            ) : (
              following.map(user => (
                <div key={user._id} className="user-suggestion">
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>{user.bio}</p>
                  </div>
                  <button 
                    className="follow-btn following"
                    onClick={() => handleUnfollow(user._id)}
                  >
                    Se désabonner
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h2>Mes abonnés ({followers.length})</h2>
          <div className="friends-list">
            {followers.length === 0 ? (
              <p className="empty-state">Personne ne vous suit encore</p>
            ) : (
              followers.map(user => (
                <div key={user._id} className="user-suggestion">
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>{user.bio}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h2>Suggestions de conteurs</h2>
          <div className="friends-list">
            {suggestions.map(suggestedUser => (
              <div key={suggestedUser._id} className="user-suggestion">
                <div className="user-avatar">👤</div>
                <div className="user-info">
                  <h3>{suggestedUser.name}</h3>
                  <p>{suggestedUser.bio}</p>
                </div>
                <button 
                  className={`follow-btn ${suggestedUser.isFollowing ? 'following' : ''}`}
                  onClick={() => handleFollow(suggestedUser._id)}
                >
                  {suggestedUser.isFollowing ? 'Abonné' : 'S\'abonner'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;