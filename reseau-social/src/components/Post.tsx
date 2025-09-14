import type { FormEvent } from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import './Post.css';
import type { PostType } from '../types';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface PostProps {
  post: PostType & {
    textContent?: string;
    audioUrl?: string; // compat rétro
    mediaUrl?: string; // si on l'ajoute côté backend plus tard
    mediaType?: 'none' | 'image' | 'video' | 'audio';
    language?: string; 
    region?: string;
    author?: { _id?: string; name?: string; avatarUrl?: string };
  };
  onLikeToggle: (postId: string) => void; // non utilisé (géré localement)
  onCommentSubmit: (postId: string, content: string) => Promise<any> | void; // non utilisé (géré localement)
  onDelete?: (postId: string) => void; // Callback pour supprimer le post
}

interface BackendComment {
  _id: string;
  content: string;
  user: { _id: string; name: string };
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

function detectMediaType(url: string): 'image' | 'video' | 'audio' | null {
  const lower = url.toLowerCase();
  if (/(\.jpeg|\.jpg|\.png|\.gif|\.webp)$/.test(lower)) return 'image';
  if (/(\.mp4|\.webm|\.ogv)$/.test(lower)) return 'video';
  if (/(\.mp3|\.wav|\.ogg)$/.test(lower)) return 'audio';
  return null;
}

const Post = ({ post, onDelete }: PostProps) => {
  const { user } = useAuth();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<BackendComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.textContent || '');
  const [editLanguage, setEditLanguage] = useState(post.language || 'Français');
  const [editRegion, setEditRegion] = useState(post.region || 'Conakry');
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorId = post.author?._id || 'anon';
  const authorName = post.author?.name || 'Anonyme';
  const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/?api\/?$/, '');
  const absoluteUrl = (u?: string) => (u && !u.startsWith('http') ? `${API_ORIGIN}${u}` : (u || ''));
  const authorAvatar = absoluteUrl(post.author?.avatarUrl) || `https://i.pravatar.cc/150?u=${authorId}`;

  const likeIds = useMemo(() => (post.likes || []).map((id: any) => id?.toString()).filter(Boolean), [post.likes]);
  const initialLiked = useMemo(() => (user ? likeIds.includes(user._id) : false), [user, likeIds]);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState<number>(likeIds.length);

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(likeIds.length);
  }, [initialLiked, likeIds]);

  // Vérifier si le post est sauvegardé au chargement
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) return;
      try {
        const response = await api.get(`/users/posts/${post._id}/is-saved`);
        setSaved(response.data.isSaved);
      } catch (err) {
        console.error('Erreur vérification sauvegarde:', err);
      }
    };
    
    checkSavedStatus();
  }, [post._id, user]);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleComments = async () => {
    if (!commentsVisible) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post._id}/comments`);
        setComments(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
    setCommentsVisible(!commentsVisible);
  };

  const handleLikeClick = async () => {
    if (!user) return; // protégé par route mais sécurité supplémentaire
    if (likePending) return;
    setLikePending(true);
    try {
      const res = await api.patch(`/posts/${post._id}/vote`);
      const updated = res.data.data;
      const ids = (updated.likes || []).map((id: any) => id?.toString()).filter(Boolean);
      setLikesCount(ids.length);
      setLiked(user ? ids.includes(user._id) : false);
    } catch (err) {
      console.error(err);
    } finally {
      setLikePending(false);
    }
  };

  const handleCommentFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { content });
      const created: BackendComment = res.data.data;
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        onDelete?.(post._id);
        setShowMenu(false);
      } catch (err: any) {
        console.error('Erreur de suppression:', err);
        const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
        alert(errorMessage);
      }
    }
  };

  const handleSaveEdit = () => {
    post.textContent = editContent;
    post.language = editLanguage;
    post.region = editRegion;
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(post.textContent || '');
    setEditLanguage(post.language || 'Français');
    setEditRegion(post.region || 'Conakry');
    setIsEditing(false);
  };

  const handleSaveToggle = async () => {
    if (!user || savePending) return;
    setSavePending(true);
    try {
      if (saved) {
        await api.delete(`/users/posts/${post._id}/save`);
        setSaved(false);
      } else {
        await api.post(`/users/posts/${post._id}/save`);
        setSaved(true);
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setSavePending(false);
    }
  };

  const isOwnPost = user && post.author?._id === user._id;

  const renderMedia = () => {
    // Supporte plusieurs schémas de backend: mediaUrl, imageUrl, videoUrl, audioUrl
    const anyPost: any = post as any;
    const urlRaw = post.mediaUrl || post.audioUrl || anyPost.imageUrl || anyPost.videoUrl;
    if (!urlRaw) return null;

    const url = typeof urlRaw === 'string' && urlRaw.startsWith('http') ? urlRaw : `${API_URL}${urlRaw}`;

    // Déterminer le type selon la clé prioritaire ou l'extension
    let type: 'image' | 'video' | 'audio' | null = post.mediaType || null;
    if (!type) {
      if (anyPost.imageUrl) type = 'image';
      else if (anyPost.videoUrl) type = 'video';
      else if (post.audioUrl) type = 'audio';
      else type = detectMediaType(url);
    }

    if (type === 'image') {
      return <img src={url} alt="media" className="post-media post-image" />;
    }
    if (type === 'video') {
      return <video src={url} controls className="post-media post-video" />;
    }
    if (type === 'audio') {
      return <audio src={url} controls className="post-media post-audio" />;
    }
    return null;
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${authorId}`}>
          <img src={authorAvatar} alt={authorName} className="post-avatar" />
        </Link>
        <div className="post-author-info">
          <Link to={`/profile/${authorId}`} className="post-author-name">{authorName}</Link>
          <span className="post-type">{post.type || ''} · {post.language || ''} · {post.region || ''}</span>
        </div>
        {isOwnPost && (
          <div className="post-menu-container" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="post-menu-button"
              aria-label="Options de la publication"
            >
              ⋯
            </button>
            {showMenu && (
              <div className="post-menu">
                <button onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }} className="post-menu-item edit">
                  ✏️ Modifier
                </button>
                <button onClick={handleDeletePost} className="post-menu-item delete">
                  🗑️ Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="post-content">
        {isEditing ? (
          <div className="edit-form">
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              rows={4}
            />

            <div className="edit-selects">
              <select value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)}>
                <option value="Français">Français</option>
                <option value="Soussou">Soussou</option>
                <option value="Peul">Peul</option>
                <option value="Malinké">Malinké</option>
                <option value="Kissi">Kissi</option>
                <option value="Toma">Toma</option>
              </select>
              <select value={editRegion} onChange={(e) => setEditRegion(e.target.value)}>
                <option value="Conakry">Conakry</option>
                <option value="Kindia">Kindia</option>
                <option value="Boké">Boké</option>
                <option value="Labé">Labé</option>
                <option value="Mamou">Mamou</option>
                <option value="Faranah">Faranah</option>
                <option value="Kankan">Kankan</option>
                <option value="Nzérékoré">Nzérékoré</option>
              </select>
            </div>
            <div className="edit-actions">
              <button onClick={handleSaveEdit} className="save-btn">
                ✓ Enregistrer
              </button>
              <button onClick={handleCancelEdit} className="cancel-btn">
                ✕ Annuler
              </button>
            </div>
          </div>
        ) : (
          <p>{post.textContent || (post as any).content || ''}</p>
        )}
        {renderMedia()}
      </div>
      <div className="post-footer">
        <button className={`post-action-button ${liked ? 'liked' : ''}`} onClick={handleLikeClick} disabled={likePending}>
          {liked ? '❤️' : '🤍'} {likesCount} Like
        </button>
        <button className="post-action-button" onClick={handleToggleComments}>
          💬 Commenter
        </button>
        <button 
          className={`post-action-button ${saved ? 'saved' : ''}`} 
          onClick={handleSaveToggle}
          disabled={savePending}
        >
          {saved ? '💾' : '💾'} {saved ? 'Sauvegardé' : 'Sauvegarder'}
        </button>
        <button className="post-action-button">🔗 Partager</button>
      </div>
      {commentsVisible && (
        <div className="comment-section">
          <form onSubmit={handleCommentFormSubmit} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="comment-input"
            />
            <button type="submit" className="comment-submit-btn">Publier</button>
          </form>
          <div className="comment-list">
            {loadingComments && <div>Chargement des commentaires...</div>}
            {!loadingComments && comments.map((comment) => (
              <div key={comment._id} className="comment">
                <span className="comment-author">{comment.user?.name || 'Utilisateur'}:</span>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
            {!loadingComments && comments.length === 0 && <p className="no-comments">Aucun commentaire pour l'instant.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
