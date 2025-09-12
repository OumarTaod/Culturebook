import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Notifications.css';

const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
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
  read: boolean;
  createdAt: string;
}

const REFRESH_INTERVAL = 30000; // 30 secondes

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalNotif, setModalNotif] = useState<Notification | null>(null);

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
    const previousNotifications = [...notifications];
    try {
      // Marquer la notification individuelle comme lue
      if (!notification.read) {
        // Mise à jour optimiste
        setNotifications(prev => prev.map(n =>
          n._id === notification._id ? { ...n, read: true } : n
        ));
        await api.patch(`/notifications/${notification._id}/read`);
      }

      // Ouvrir une modale d'aperçu si c'est un like/commentaire lié à un post
      if (notification.post) {
        setModalNotif(notification);
      } else if (notification.type === NOTIFICATION_TYPES.FOLLOW) {
        navigate(`/profile/${notification.sender._id}`);
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de la notification');
      // Retour à l'état précédent en cas d'échec
      setNotifications(previousNotifications);
      console.error(err);
    }
  }, [navigate, notifications]);

  const closeModal = () => setModalNotif(null);
  const openPost = () => {
    if (modalNotif?.post?._id) {
      const pid = modalNotif.post._id;
      setModalNotif(null);
      navigate(`/post/${pid}`);
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
        {hasUnread && (
          <button onClick={markAsRead} className="mark-read-button">
            Marquer tout comme lu
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <button
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
              aria-label={`Notification de ${notification.sender.name}: ${getNotificationText(notification)}`}
            >
              <div className="notification-icon">
                {notification.sender?.avatarUrl ? (
                  <img src={notification.sender.avatarUrl} alt={notification.sender.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getNotificationIcon(notification.type)
                )}
              </div>
              <div className="notification-content">
                <p className="notification-text">
                  {getNotificationText(notification)}
                </p>
                {notification.post && (
                  <div className="notification-preview-wrap">
                    {notification.post.imageUrl && (
                      <img src={notification.post.imageUrl} alt="aperçu" className="notification-thumb" />
                    )}
                    <p className="notification-preview">
                      {notification.post.textContent.length > 100
                        ? `${notification.post.textContent.substring(0, 100)}...`
                        : notification.post.textContent}
                    </p>
                  </div>
                )}
                <span className="notification-time">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="no-notifications">
            Vous n'avez aucune notification pour le moment
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {modalNotif && (
        <div className="notif-modal-overlay" onClick={closeModal}>
          <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <h3>{getNotificationText(modalNotif)}</h3>
              <button className="notif-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {modalNotif.sender?.avatarUrl && (
                <img src={modalNotif.sender.avatarUrl} alt={modalNotif.sender.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <strong>{modalNotif.sender?.name}</strong>
            </div>
            {modalNotif.post?.imageUrl && (
              <img src={modalNotif.post.imageUrl} alt="aperçu" className="notif-modal-image" />
            )}
            {modalNotif.post?.textContent && (
              <p className="notif-modal-text">{modalNotif.post.textContent}</p>
            )}
            <div className="notif-modal-actions">
              <button onClick={openPost} className="open-post-btn">Ouvrir la publication</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
