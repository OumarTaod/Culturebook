import { Link, NavLink, useLocation } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';
import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { socketService } from '../services/socketService';

const POLL_MS = 30000;

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      alert('Mot de passe modifié avec succès');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      alert('Erreur lors du changement de mot de passe');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/delete-account');
      logout();
    } catch (error) {
      alert('Erreur lors de la suppression du compte');
    }
  };

  const confirmLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const confirmDeleteAccount = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) {
      setShowDeleteModal(true);
    }
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink to="/follow" className={getNavLinkClass} aria-label="Suivre">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2 1l-3 4v2h2l2.54-3.4L16.5 18H20zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm1.5 2h-2C3.67 8 2.4 9.24 2.05 10.8L2 22h2v-7h2v7h2v-7.5c0-.28-.22-.5-.5-.5z"/>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink to="/notifications" className={getNavLinkClass} aria-label="Notifications" style={{ position: 'relative' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="nav-badge" aria-label={`${unreadCount} notifications non lues`}>{unreadCount}</span>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/messages" className={getNavLinkClass} aria-label="Messages">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
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
          <button className="nav-action" aria-label="Créer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <div className="user-menu-container" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="nav-action" 
              aria-label="Menu utilisateur"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            {showUserMenu && (
              <div className="user-menu">
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    Administration
                  </Link>
                )}
                <button onClick={() => { setShowPasswordModal(true); setShowUserMenu(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                  Changer mot de passe
                </button>
                <button onClick={confirmLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  Déconnexion
                </button>
                <button onClick={confirmDeleteAccount} className="delete-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Supprimer le compte
                </button>
              </div>
            )}
          </div>
        </div>
      )}



      {toast && (
        <div className="toast-notice" role="status" aria-live="polite">{toast}</div>
      )}

      {/* Modal changement de mot de passe */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Changer le mot de passe</h3>
              <button onClick={() => setShowPasswordModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="modal-input"
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="modal-input"
              />
              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPasswordModal(false)} className="btn-cancel">
                Annuler
              </button>
              <button onClick={handleChangePassword} className="btn-confirm">
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Supprimer le compte</h3>
              <button onClick={() => setShowDeleteModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p>Voulez-vous vraiment supprimer définitivement votre compte ?</p>
              <p><strong>Cette action est irréversible.</strong></p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">
                Annuler
              </button>
              <button onClick={handleDeleteAccount} className="btn-delete">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
