import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';

import SuggestedUsers from '../components/SuggestedUsers';
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
  const [trends, setTrends] = useState<{tag: string, count: number, posts: PostType[]}[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const location = useLocation();

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

  useEffect(() => { 
    fetchPosts(1);
    fetchTrends();
    fetchActivities();
  }, [fetchPosts]);

  const fetchTrends = async () => {
    try {
      const postsByType = posts.reduce((acc: {[key: string]: {count: number, posts: PostType[]}}, post) => {
        const tag = `#${post.type}`;
        if (!acc[tag]) acc[tag] = { count: 0, posts: [] };
        acc[tag].count++;
        acc[tag].posts.push(post);
        return acc;
      }, {});
      
      const trendsData = Object.entries(postsByType)
        .map(([tag, data]) => ({ tag, count: data.count, posts: data.posts }))
        .sort((a, b) => b.count - a.count)
        .slice(0, window.innerWidth <= 767 ? 2 : 3);
      
      setTrends(trendsData);
    } catch (err) {
      console.error('Erreur tendances:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const recentPosts = posts
        .filter(post => post.author._id !== user?._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      const activitiesData = recentPosts.map(post => ({
        type: 'post',
        postId: post._id,
        user: post.author.name,
        avatar: post.author.name[0]?.toUpperCase(),
        action: `a publié un ${post.type.toLowerCase()}`,
        time: formatTimeAgo(post.createdAt)
      }));
      
      setActivities(activitiesData);
    } catch (err) {
      console.error('Erreur activités:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Il y a quelques minutes';
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  // Scroll vers une publication spécifique depuis les notifications
  useEffect(() => {
    const state = location.state as any;
    if (state?.scrollToPost && posts.length > 0) {
      const postElement = document.getElementById(`post-${state.scrollToPost}`);
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.style.animation = 'highlight 2s ease-in-out';
      }
    }
  }, [location.state, posts]);

  useEffect(() => {
    if (posts.length > 0) {
      fetchTrends();
      fetchActivities();
    }
  }, [posts, user?._id]);

  // Si l'utilisateur met à jour son avatar (dans le profil), mettre à jour instantanément dans le feed
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

  const handleCreatePost = async (content: string, type: 'Proverbe' | 'Conte' | 'Histoire', mediaFile?: File, language?: string, region?: string) => {
    try {
      const formData = new FormData();
      formData.append('textContent', content);
      formData.append('type', type);
      formData.append('language', language || 'Français');
      formData.append('region', region || 'Conakry');

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
        {/* <div className="card">
          <h3 data-icon="navigation">Navigation</h3>
          <ul className="links">
            <li>🧑‍🤝‍🧑 Amis</li>
            <li>👥 Groupes</li>
            <li>💾 Sauvegardés</li>
            <li>🛒 Store</li>
          </ul>
        </div> */}
        <div className="card">
          <h3 data-icon="trending">Tendances</h3>
          <div className="trending-topics">
            {trends.length > 0 ? trends.map((trend, index) => (
              <div 
                key={index} 
                className="trending-item"
                onClick={() => {
                  const firstPost = trend.posts[0];
                  if (firstPost) {
                    const element = document.getElementById(`post-${firstPost._id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.style.animation = 'highlight 2s ease-in-out';
                    }
                  }
                }}
              >
                <span className="trending-tag">{trend.tag}</span>
                <span className="trending-count">{trend.count} publication{trend.count > 1 ? 's' : ''}</span>
              </div>
            )) : (
              <div className="trending-item">
                <span className="trending-tag">#Aucune tendance</span>
                <span className="trending-count">Publiez pour créer des tendances</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="home-center">
        <div className="hero-section">
          <div className="hero-background">
            <div className="hero-pattern"></div>
            <div className="hero-glow"></div>
          </div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">🌍</span>
              <span>Plateforme Culturelle </span>
            </div>
            <h1 className="hero-title">
              Votre <span className="gradient-text">héritage culturel</span>
              <br />mérite d'être immortalisé
            </h1>
            <p className="hero-subtitle">
              Transformez vos souvenirs en légacy numérique. Partagez, découvrez et connectez-vous à travers les cultures des regions de la Guinée.
              <strong> Votre histoire inspire, votre culture unit.</strong>
            </p>
            {/* <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span>Création Facile</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Communauté Active</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>100% Gratuit</span>
              </div>
            </div> */}
            <div className="hero-actions">
              <button className="hero-cta-primary" onClick={() => {
                const createPost = document.querySelector('.create-post-container');
                createPost?.scrollIntoView({ behavior: 'smooth' }); 
              }}>
                <span className="cta-icon">✨</span>
                <div className="cta-content">
                  <span className="cta-title">Commencer l'avanture </span>
                  <span className="cta-subtitle">Créez des publications</span>
                </div>
              </button>
              <button className="hero-cta-secondary" onClick={() => {
                const postsContainer = document.querySelector('.posts-container');
                postsContainer?.scrollIntoView({ behavior: 'smooth' });
              }}>
                <span className="cta-icon">🔍</span>
                <div className="cta-content">
                  <span className="cta-title">Voir les Tendances</span>
                  <span className="cta-subtitle">Découvrez ce qui buzz</span>
                </div>
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-icon">📖</div>
                <div className="stat-info">
                  <span className="stat-number">{posts.length}</span>
                  <span className="stat-label">Traditions préservées</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-number">{Math.floor(posts.length * 2.5) || 25}</span>
                  <span className="stat-label">Gardiens de la culture</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🌍</div>
                <div className="stat-info">
                  <span className="stat-number">{new Set(posts.map(p => p.region)).size || 8}</span>
                  <span className="stat-label">Cultures africaines</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CreatePost onPostSubmit={handleCreatePost} />
      <div className="posts-container">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post._id} id={`post-${post._id}`} className="fade-in">
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
        {!hasMore && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>
            Suivez d'autres personnes pour voir plus de publications
          </div>
        )}
      </div>
      </section>

      <aside className="home-right">
        <SuggestedUsers />
        <div className="card">
          <h3 data-icon="activity">Activité récente</h3>
          <div className="activity-feed">
            {activities.length > 0 ? activities.map((activity, index) => (
              <div 
                key={index} 
                className="activity-item"
                onClick={() => {
                  if (activity.postId) {
                    const element = document.getElementById(`post-${activity.postId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.style.animation = 'highlight 2s ease-in-out';
                    }
                  }
                }}
              >
                <div className="activity-avatar">{activity.avatar}</div>
                <div className="activity-content">
                  <span className="activity-text">{activity.user} {activity.action}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            )) : (
              <div className="activity-item">
                <div className="activity-avatar">📭</div>
                <div className="activity-content">
                  <span className="activity-text">Aucune activité récente</span>
                  <span className="activity-time">Suivez des utilisateurs pour voir leur activité</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;
