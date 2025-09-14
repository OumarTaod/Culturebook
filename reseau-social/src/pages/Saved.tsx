import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import Post from '../components/Post';
import api from '../services/api';
import './Saved.css';

const Saved = () => {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const response = await api.get('/users/saved-posts');
        setSavedPosts(response.data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des posts sauvegardés:', error);
        setSavedPosts([]);
      }
    };
    
    fetchSavedPosts();
  }, []);

  useEffect(() => {
    if (activeFilter === 'Tous') {
      setFilteredPosts(savedPosts);
    } else {
      const filterMap = {
        'Contes': 'Conte',
        'Proverbes': 'Proverbe', 
        'Histoires': 'Histoire'
      };
      const filterType = filterMap[activeFilter] || activeFilter;
      setFilteredPosts(savedPosts.filter(post => post.type === filterType));
    }
  }, [savedPosts, activeFilter]);

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/users/posts/${postId}/save`);
      setSavedPosts(prev => prev.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Erreur lors de la désauvegarde:', error);
    }
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