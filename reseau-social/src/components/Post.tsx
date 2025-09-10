import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
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

const Post = ({ post }: PostProps) => {
  const { user } = useAuth();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<BackendComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likePending, setLikePending] = useState(false);

  const authorId = post.author?._id || 'anon';
  const authorName = post.author?.name || 'Anonyme';
  const authorAvatar = post.author?.avatarUrl || `https://i.pravatar.cc/150?u=${authorId}`;

  const likeIds = useMemo(() => (post.likes || []).map((id: any) => id?.toString()).filter(Boolean), [post.likes]);
  const initialLiked = useMemo(() => (user ? likeIds.includes(user._id) : false), [user, likeIds]);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState<number>(likeIds.length);

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(likeIds.length);
  }, [initialLiked, likeIds]);

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

  const renderMedia = () => {
    const urlRaw = post.mediaUrl || post.audioUrl; // compat: backend actuel renvoie audioUrl
    if (!urlRaw) return null;
    const url = urlRaw.startsWith('http') ? urlRaw : `${API_URL}${urlRaw}`;

    const type = post.mediaType || detectMediaType(url);
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
      </div>
      <div className="post-content">
        <p>{post.textContent || (post as any).content || ''}</p>
        {renderMedia()}
      </div>
      <div className="post-footer">
        <button className={`post-action-button ${liked ? 'liked' : ''}`} onClick={handleLikeClick} disabled={likePending}>
          {liked ? '❤️' : '🤍'} {likesCount} Like
        </button>
        <button className="post-action-button" onClick={handleToggleComments}>
          💬 Coment
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
