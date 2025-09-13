import { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';
import Spinner from '../components/Spinner';
import './Follow.css';

const Follow = () => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/suggestions');
        const data = response.data?.data || response.data;
        console.log('Suggestions reçues:', data);
        setSuggestions(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des suggestions:', err);
        setError("Impossible de charger les suggestions d'utilisateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggestions((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      console.error("Erreur lors du suivi de l'utilisateur:", err);
      setError('Impossible de suivre cet utilisateur.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="follow-container">
      <h2>Personnes à suivre</h2>

      {error && <div className="error">{error}</div>}

      {suggestions.length > 0 ? (
        <div className="suggestions-list">
          {suggestions.map((user) => (
            <div key={user._id} className="suggestion-card">
              <div className="suggestion-avatar">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`}
                    alt={`Avatar de ${user.name}`}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="suggestion-info">
                <h3>{user.name}</h3>
                <p>{user.bio || 'Aucune bio'}</p>
              </div>
              <button onClick={() => handleFollow(user._id)} className="follow-button">
                Suivre
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-suggestions">
          <p>Aucune suggestion disponible pour le moment.</p>
          <p>Revenez plus tard pour découvrir de nouveaux utilisateurs.</p>
        </div>
      )}
    </div>
  );
};

export default Follow;
