import { Link, NavLink, useLocation } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { socketService } from '../services/socketService';

const POLL_MS = 30000;

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getNavLinkClass: NavLinkProps['className'] = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link';

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        const list = res.data?.data || [];
        const count = (list as any[]).reduce((acc, n: any) => acc + (n.read ? 0 : 1), 0);
        setUnreadCount(count);
      } catch {}
    };

    // Initial fetch
    fetchUnread();

    // Polling
    const id = setInterval(fetchUnread, POLL_MS);

    // Socket (optional realtime)
    socketService.connect();
    const unsub = socketService.onNotification((notif) => {
      setUnreadCount((c) => c + 1);
      const text = notif.type === 'like'
        ? `${notif.sender?.name || 'Quelqu\'un'} a aimé votre publication`
        : notif.type === 'comment'
          ? `${notif.sender?.name || 'Quelqu\'un'} a commenté votre publication`
          : `${notif.sender?.name || 'Quelqu\'un'} vous a notifié`;
      setToast(text);
      setTimeout(() => setToast(''), 4000);
    });

    // Reset when viewing notifications
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }

    return () => {
      clearInterval(id);
      unsub();
      // do not disconnect socket here (other pages may use it)
    };
  }, [isAuthenticated, location.pathname]);

  return (
    <nav className={`navbar fb${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-left">
        <Link to="/" className="navbar-brand" aria-label="Accueil CultureBook">
          CultureBook
        </Link>
      </div>

      {isAuthenticated && (
        <div className="nav-center">
          <ul className="nav-center-list">
            <li>
              <NavLink to="/" className={getNavLinkClass} aria-label="Accueil">
                🏠
              </NavLink>
            </li>
            <li>
              <NavLink to="/follow" className={getNavLinkClass} aria-label="Suivre">
                👥
              </NavLink>
            </li>
            <li>
              <NavLink to="/notifications" className={getNavLinkClass} aria-label="Notifications" style={{ position: 'relative' }}>
                🔔
                {unreadCount > 0 && (
                  <span className="nav-badge" aria-label={`${unreadCount} notifications non lues`}>{unreadCount}</span>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/messages" className={getNavLinkClass} aria-label="Messages">
                ✉️
              </NavLink>
            </li>
          </ul>
        </div>
      )}

      {isAuthenticated && (
        <div className="nav-right">
          <Link to={`/profile/${user?._id}`} className="nav-user" aria-label="Profil">
            <div className="nav-avatar" aria-hidden="true">{user?.name?.[0] || 'U'}</div>
            <span className="nav-username">{user?.name}</span>
          </Link>
          <button className="nav-action" aria-label="Créer">＋</button>
          <button className="nav-action" aria-label="Menu">⋯</button>
          <button onClick={logout} className="logout-button" aria-label="Déconnexion">Déconnexion</button>
        </div>
      )}

      {toast && (
        <div className="toast-notice" role="status" aria-live="polite">{toast}</div>
      )}
    </nav>
  );
};

export default Navbar;
