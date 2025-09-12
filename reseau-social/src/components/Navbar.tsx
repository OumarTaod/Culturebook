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
          <div className="user-menu-container" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="nav-action" 
              aria-label="Menu utilisateur"
            >
              ⋯
            </button>
            {showUserMenu && (
              <div className="user-menu">
                <button onClick={() => { setShowPasswordModal(true); setShowUserMenu(false); }}>
                  🔑 Changer mot de passe
                </button>
                <button onClick={confirmLogout}>
                  🚪 Déconnexion
                </button>
                <button onClick={confirmDeleteAccount} className="delete-btn">
                  🗑️ Supprimer le compte
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
