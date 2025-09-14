import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Notifications.css';

const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  GROUP_INVITE: 'group_invite',
} as const;

type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

interface Notification {
  _id: string;
  type: NotificationType;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
    avatarUrl?: string;
  };
  post?: {
    _id: string;
    textContent: string;
    mediaUrl?: string;
    imageUrl?: string;
  };
  message?: string;
  data?: {
    groupId?: string;
    groupName?: string;
  };
  read: boolean;
  createdAt: string;
}

const REFRESH_INTERVAL = 30000; // 30 secondes

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hiddenNotifications, setHiddenNotifications] = useState<string[]>([]);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') as string;
  const API_ORIGIN = API_BASE.replace(/\/?api\/?$/, '');
  
  const toAbsolute = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_ORIGIN}${url}`;
  };

  const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications]);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        if (isMounted) {
          setNotifications(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Erreur lors du chargement des notifications');
        }
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialNotifications();

    const intervalId = setInterval(async () => {
      try {
        const response = await api.get('/notifications');
        if (isMounted) {
          setNotifications(response.data.data);
        }
      } catch (err) {
        console.error('Erreur lors du rafraîchissement des notifications', err);
      }
    }, REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Auto-mark all as read when opening the page
  useEffect(() => {
    const markAll = async () => {
      try {
        if (notifications.some(n => !n.read)) {
          await api.patch('/notifications/read');
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
      } catch (err) {
        // ignore
      }
    };
    markAll();
  }, [notifications]);

  const markAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    // Mise à jour optimiste
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    try {
      await api.patch('/notifications/read');
    } catch (err) {
      setError('Erreur lors du marquage des notifications comme lues');
      // Retour à l'état précédent en cas d'échec
      setNotifications(previousNotifications);
      console.error(err);
    }
  }, [notifications]);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      // Marquer comme lu
      if (!notification.read) {
        setNotifications(prev => prev.map(n =>
          n._id === notification._id ? { ...n, read: true } : n
        ));
        await api.patch(`/notifications/${notification._id}/read`);
      }

      // Navigation vers la page d'accueil pour voir la publication
      if (notification.post) {
        navigate('/', { state: { scrollToPost: notification.post._id } });
      } else if (notification.type === NOTIFICATION_TYPES.FOLLOW) {
        navigate(`/profile/${notification.sender._id}`);
      }
    } catch (err) {
      setError('Erreur lors de la navigation');
      console.error(err);
    }
  }, [navigate]);

  const deleteNotification = useCallback((notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenNotifications(prev => [...prev, notificationId]);
  }, []);

  const clearAllNotifications = useCallback(() => {
    if (!confirm('Masquer toutes les notifications ?')) return;
    const allIds = notifications.map(n => n._id);
    setHiddenNotifications(prev => [...prev, ...allIds]);
  }, [notifications]);

  const handleGroupInvite = async (groupId: string, action: 'accept' | 'decline', notificationId: string) => {
    try {
      await api.post(`/groups/${action}-invite`, { groupId });
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (action === 'accept') {
        navigate(`/groups/${groupId}`);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de l\'invitation:', error);
      setError('Erreur lors de la gestion de l\'invitation');
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.LIKE:
        return `${notification.sender.name} a aimé votre publication`;
      case NOTIFICATION_TYPES.COMMENT:
        return `${notification.sender.name} a commenté votre publication`;
      case NOTIFICATION_TYPES.FOLLOW:
        return `${notification.sender.name} a commencé à vous suivre`;
      case NOTIFICATION_TYPES.GROUP_INVITE:
        return notification.message || `${notification.sender.name} vous a invité à rejoindre un groupe`;
      default:
        return 'Nouvelle notification';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NOTIFICATION_TYPES.LIKE:
        return '❤️';
      case NOTIFICATION_TYPES.COMMENT:
        return '💬';
      case NOTIFICATION_TYPES.FOLLOW:
        return '👤';
      case NOTIFICATION_TYPES.GROUP_INVITE:
        return '👥';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="notifications-loading">Chargement des notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <div className="header-actions">
          {hasUnread && (
            <button onClick={markAsRead} className="mark-read-button">
              ✓ Tout lire
            </button>
          )}
          {notifications.filter(n => !hiddenNotifications.includes(n._id)).length > 0 && (
            <button onClick={clearAllNotifications} className="clear-all-button">
              👁️ Tout masquer
            </button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {notifications.filter(n => !hiddenNotifications.includes(n._id)).length > 0 ? (
          notifications.filter(n => !hiddenNotifications.includes(n._id)).map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {notification.sender?.avatarUrl || notification.sender?.profilePicture ? (
                  <img 
                    src={toAbsolute(notification.sender.avatarUrl || notification.sender.profilePicture)} 
                    alt={notification.sender.name} 
                  />
                ) : (
                  <span className="icon-emoji">{getNotificationIcon(notification.type)}</span>
                )}
              </div>
              
              <div className="notification-content">
                <div className="notification-main">
                  <p className="notification-text">
                    <strong>{notification.sender.name}</strong>
                    <span className="action-text">
                      {notification.type === 'like' && ' a aimé votre publication'}
                      {notification.type === 'comment' && ' a commenté votre publication'}
                      {notification.type === 'follow' && ' a commencé à vous suivre'}
                      {notification.type === 'group_invite' && (
                        <span> vous a invité à rejoindre le groupe "{notification.data?.groupName}"</span>
                      )}
                    </span>
                  </p>
                  <span className="notification-time">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                
                {notification.post && (
                  <div className="post-preview">
                    {(notification.post.imageUrl || notification.post.mediaUrl) && (
                      <img 
                        src={toAbsolute(notification.post.imageUrl || notification.post.mediaUrl)} 
                        alt="aperçu" 
                        className="preview-image" 
                      />
                    )}
                    <p className="preview-text">
                      {notification.post.textContent?.substring(0, 80)}{notification.post.textContent && '...'}
                    </p>
                  </div>
                )}
                
                {notification.type === 'group_invite' && (
                  <div className="group-invite-actions">
                    <button 
                      className="accept-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupInvite(notification.data?.groupId || '', 'accept', notification._id);
                      }}
                    >
                      Accepter
                    </button>
                    <button 
                      className="decline-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupInvite(notification.data?.groupId || '', 'decline', notification._id);
                      }}
                    >
                      Décliner
                    </button>
                  </div>
                )}
              </div>
              
              <button
                className={`delete-btn ${deleting === notification._id ? 'deleting' : ''}`}
                onClick={(e) => deleteNotification(notification._id, e)}
                disabled={deleting === notification._id}
              >
                {deleting === notification._id ? '⏳' : '✕'}
              </button>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            Vous n'avez aucune notification pour le moment
          </div>
        )}
      </div>

      {error && (
        <div className="error-toast">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
