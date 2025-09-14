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
      // Simuler des données pour le moment
      setSuggestions([
        { _id: '1', name: 'Mamadou Diallo', bio: 'Spécialiste des contes Peuls', isFollowing: false },
        { _id: '2', name: 'Fatoumata Camara', bio: 'Proverbes Soussou traditionnels', isFollowing: false },
        { _id: '3', name: 'Alpha Bah', bio: 'Histoires de Fouta Djallon', isFollowing: false }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      // Simuler l'abonnement
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
      
      // Ajouter à la liste des abonnements si on suit
      const userToFollow = suggestions.find(u => u._id === userId);
      if (userToFollow && !userToFollow.isFollowing) {
        setFollowing(prev => [...prev, { ...userToFollow, isFollowing: true }]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
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
                    onClick={() => handleFollow(user._id)}
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