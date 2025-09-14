import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import Post from '../components/Post';
import './Saved.css';

const Saved = () => {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    // Simuler des posts sauvegardés
    const mockSavedPosts = [
      {
        _id: '1',
        textContent: 'Qui veut aller loin ménage sa monture',
        type: 'Proverbe',
        language: 'Français',
        region: 'Conakry',
        author: { _id: 'u1', name: 'Mamadou Diallo' },
        likes: ['u2', 'u3'],
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        textContent: 'Il était une fois, dans un village lointain...',
        type: 'Conte',
        language: 'Soussou',
        region: 'Kindia',
        author: { _id: 'u2', name: 'Fatoumata Camara' },
        likes: ['u1'],
        createdAt: new Date().toISOString()
      }
    ];
    setSavedPosts(mockSavedPosts);
  }, []);

  useEffect(() => {
    if (activeFilter === 'Tous') {
      setFilteredPosts(savedPosts);
    } else {
      setFilteredPosts(savedPosts.filter(post => post.type === activeFilter));
    }
  }, [savedPosts, activeFilter]);

  const handleDeletePost = (postId: string) => {
    setSavedPosts(prev => prev.filter(post => post._id !== postId));
  };

  return (
    <div className="saved-page">
      <div className="saved-header">
        <h1>💾 Sauvegardés</h1>
        <p>Retrouvez vos publications favorites</p>
      </div>

      <div className="saved-filters">
        {['Tous', 'Contes', 'Proverbes', 'Histoires'].map(filter => (
          <button 
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="saved-content">
        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💾</div>
            <h3>Aucune publication sauvegardée</h3>
            <p>Sauvegardez vos publications préférées pour les retrouver facilement</p>
          </div>
        ) : (
          <div className="posts-list">
            {filteredPosts.map(post => (
              <Post
                key={post._id}
                post={post}
                onLikeToggle={() => {}}
                onCommentSubmit={() => {}}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;