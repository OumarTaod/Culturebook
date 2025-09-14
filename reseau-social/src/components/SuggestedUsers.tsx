import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { User } from '../types';
import './SuggestedUsers.css';

const SuggestedUsers = () => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/users/suggestions');
        setSuggestions(response.data.data.slice(0, 5)); // Limiter à 5 suggestions
      } catch (err) {
        console.error('Erreur lors du chargement des suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="card">
        <h3>Suggestions</h3>
        <div className="suggestions-loading">Chargement...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3>Suggestions pour vous</h3>
      <div className="suggestions-list">
        {suggestions.map((user) => (
          <div key={user._id} className="suggestion-item">
            <div className="suggestion-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || 'Utilisateur'} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="suggestion-info">
              <span 
                className="suggestion-name"
                onClick={() => handleUserClick(user._id)}
              >
                {user.name || 'Utilisateur'}
              </span>
              <span className="suggestion-bio">
                {user.bio || 'Nouveau membre'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;