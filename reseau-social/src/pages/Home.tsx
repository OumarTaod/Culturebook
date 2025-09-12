import { useState, useEffect, useRef, useCallback } from 'react';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import api from '../services/api';
import Spinner from '../components/Spinner';
import type { PostType, User } from '../types';
import './Home.css';

const LIMIT = 10;

const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (pageToLoad: number) => {
    try {
      if (pageToLoad === 1) setIsLoading(true); else setIsLoadingMore(true);
      const response = await api.get(`/posts?page=${pageToLoad}&limit=${LIMIT}`);
      const data = response.data;
      if (pageToLoad === 1) {
        setPosts(data.data);
      } else {
        setPosts((prev) => [...prev, ...data.data]);
      }
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError('Impossible de charger les publications.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchSideData = useCallback(async () => {
    try {
      const [sug, foll] = await Promise.all([
        api.get('/users/suggestions'),
        api.get('/users/following')
      ]);
      setSuggestions(sug.data?.data || sug.data || []);
      setFollowing(foll.data?.data || foll.data || []);
    } catch (e) {
      // silent
    }
  }, []);

  useEffect(() => { fetchPosts(1); fetchSideData(); }, [fetchPosts, fetchSideData]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          const next = page + 1;
          setPage(next);
          fetchPosts(next);
        }
      });
    }, { rootMargin: '600px 0px 600px 0px' });

    observer.observe(sentinel);
    return () => { observer.disconnect(); };
  }, [page, hasMore, isLoadingMore, fetchPosts]);

  const handleCreatePost = async (content: string, type: 'Proverbe' | 'Conte' | 'Histoire', mediaFile?: File) => {
    try {
      const formData = new FormData();
      formData.append('textContent', content);
      formData.append('type', type);
      formData.append('language', 'Français');
      formData.append('region', 'Conakry');

      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      const response = await api.post('/posts', formData);
      setPosts((prev) => [response.data.data, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const response = await api.patch(`/posts/${postId}/vote`);
      const updatedPost = response.data.data;
      setPosts(prev => prev.map(post => post._id === postId ? updatedPost : post));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (postId: string, content: string): Promise<any> => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { content });
      return response.data.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  if (isLoading) return <Spinner />;

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-grid">
      <aside className="home-left">
        <div className="card">
          <h3>Raccourcis</h3>
          <ul className="links">
            <li>🧑‍🤝‍🧑 Amis</li>
            <li>👥 Groupes</li>
            <li>💾 Sauvegardés</li>
            <li>🛒 Marketplace</li>
          </ul>
        </div>
        <div className="card">
          <h3>Suggestions</h3>
          <ul className="suggestions">
            {suggestions.slice(0, 8).map(u => (
              <li key={u._id} className="suggestion-item">
                <div className="avatar" />
                <span className="name">{u.name}</span>
              </li>
            ))}
            {suggestions.length === 0 && <li className="muted">Aucune suggestion</li>}
          </ul>
        </div>
      </aside>

      <section className="home-center">
        <CreatePost onPostSubmit={handleCreatePost} />
        <div className="posts-container">
          {posts.length > 0 ? (
            posts.map(post => (
              <div key={post._id} className="fade-in">
                <Post
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onCommentSubmit={handleCommentSubmit}
                />
              </div>
            ))
          ) : (
            <div className="no-posts-message">Aucune publication pour le moment.</div>
          )}
          {hasMore && (
            <div ref={sentinelRef} style={{ height: 1 }} />
          )}
          {isLoadingMore && (
            <div className="small muted" style={{ textAlign: 'center', padding: '16px' }}>
              Chargement...
            </div>
          )}
        </div>
      </section>

      <aside className="home-right">
        <div className="card">
          <h3>Contacts</h3>
          <ul className="contacts">
            {following.map(u => (
              <li key={u._id} className="contact-item">
                <div className="status-dot online" />
                <span className="name">{u.name}</span>
              </li>
            ))}
            {following.length === 0 && <li className="muted">Aucun contact</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Home;
