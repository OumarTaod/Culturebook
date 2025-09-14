import { useState, useEffect, useRef, useCallback } from 'react';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import CultureSlider from '../components/CultureSlider';
import api from '../services/api';
import Spinner from '../components/Spinner';
import type { PostType } from '../types';
import './Home.css';
import { useAuth } from '../auth/AuthContext';
import { CommunityIcon, LibraryIcon, EventsIcon, DiscoverIcon, FavoritesIcon } from '../components/NavigationIcons';

const LIMIT = 10;

const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

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

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  useEffect(() => {
    if (!user?.avatarUrl || !user?._id) return;
    setPosts((prev) => prev.map((p) => {
      const author: any = (p as any).author;
      if (author && (author._id === user._id)) {
        return { ...p, author: { ...author, avatarUrl: user.avatarUrl } } as PostType;
      }
      return p;
    }));
  }, [user?._id, user?.avatarUrl]);

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
          <h3 data-icon="navigation">Navigation</h3>
          <ul className="links">
            <li>
              <CommunityIcon />
              Communauté
            </li>
            <li>
              <LibraryIcon />
              Bibliothèque
            </li>
            <li>
              <EventsIcon />
              Événements
            </li>
            <li>
              <DiscoverIcon />
              Découvrir
            </li>
            <li>
              <FavoritesIcon />
              Favoris
            </li>
          </ul>
        </div>
        <div className="card">
          <h3 data-icon="trending">Tendances</h3>
          <div className="trending-topics">
            <div className="trending-item">
              <span className="trending-tag">#ContesTradition</span>
              <span className="trending-count">142 publications</span>
            </div>
            <div className="trending-item">
              <span className="trending-tag">#ProverbesAfricains</span>
              <span className="trending-count">89 publications</span>
            </div>
            <div className="trending-item">
              <span className="trending-tag">#HistoireLocale</span>
              <span className="trending-count">67 publications</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="home-center">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Partagez votre <span className="gradient-text">culture</span>
            </h1>
            <p className="hero-subtitle">
              Découvrez et partagez les richesses culturelles de votre région.
              Contes, proverbes, histoires... Votre patrimoine n'attend que vous !
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-label">Publications</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Utilisateurs</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Cultures</span>
              </div>
            </div>
          </div>
        </div>
        <CultureSlider />
        <CreatePost onPostSubmit={handleCreatePost} />
      <div className="posts-container">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post._id} className="fade-in">
              <Post
                post={post}
                onLikeToggle={handleLikeToggle}
                onCommentSubmit={handleCommentSubmit}
                onDelete={(postId) => setPosts(prev => prev.filter(p => p._id !== postId))}
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
          <h3 data-icon="activity">Activité récente</h3>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-avatar">O</div>
              <div className="activity-content">
                <span className="activity-text">Oumar a publié un nouveau conte</span>
                <span className="activity-time">Il y a 2h</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar">A</div>
              <div className="activity-content">
                <span className="activity-text">Ahmed a aimé votre proverbe</span>
                <span className="activity-time">Il y a 4h</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar">F</div>
              <div className="activity-content">
                <span className="activity-text">Fatou a commenté une histoire</span>
                <span className="activity-time">Il y a 6h</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;