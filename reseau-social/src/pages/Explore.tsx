import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import Post from '../components/Post';
import type { PostType } from '../types';
import './Explore.css';

const Explore = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [allPosts, setAllPosts] = useState<PostType[]>([]);

  useEffect(() => {
    // Charger tous les posts au démarrage
    const fetchAllPosts = async () => {
      try {
        const response = await api.get('/posts');
        setAllPosts(response.data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      }
    };
    fetchAllPosts();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(allPosts);
      return;
    }

    setLoading(true);
    try {
      // Recherche locale dans les posts
      const filtered = allPosts.filter(post => 
        post.textContent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, allPosts]);

  const handleDeletePost = (postId: string) => {
    setSearchResults(prev => prev.filter(post => post._id !== postId));
    setAllPosts(prev => prev.filter(post => post._id !== postId));
  };

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h1>Explorer</h1>
        <p>Découvrez les traditions et cultures partagées par la communauté</p>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher des publications, utilisateurs, régions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="search-results">
        {loading && <div className="loading">Recherche en cours...</div>}
        
        {!loading && searchQuery && (
          <div className="results-info">
            {searchResults.length} résultat(s) pour "{searchQuery}"
          </div>
        )}

        {!loading && !searchQuery && (
          <div className="results-info">
            {allPosts.length} publication(s) au total
          </div>
        )}

        <div className="posts-grid">
          {searchResults.map((post) => (
            <Post
              key={post._id}
              post={post}
              onLikeToggle={() => {}}
              onCommentSubmit={() => {}}
              onDelete={handleDeletePost}
            />
          ))}
        </div>

        {!loading && searchResults.length === 0 && searchQuery && (
          <div className="no-results">
            <p>Aucun résultat trouvé pour "{searchQuery}"</p>
            <p>Essayez avec d'autres mots-clés</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;