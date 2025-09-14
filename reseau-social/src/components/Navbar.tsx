// Importation des composants de routage React Router
import { Link, NavLink, useLocation } from 'react-router-dom';
// Importation du type pour les props de NavLink
import type { NavLinkProps } from 'react-router-dom';
// Importation du contexte d'authentification
import { useAuth } from '../auth/AuthContext';
// Importation des styles CSS de la navbar
import './Navbar.css';
// Importation des hooks React nécessaires
import { useEffect, useState, useRef } from 'react';
// Importation du service API pour les requêtes HTTP
import api from '../services/api';
// Importation du service Socket.IO pour les notifications temps réel
import { socketService } from '../services/socketService';

// Constante pour l'intervalle de polling des notifications (30 secondes)
const POLL_MS = 30000;

// Composant principal de la barre de navigation
const Navbar = () => {
  // Récupération des données d'authentification depuis le contexte
  const { isAuthenticated, logout, user } = useAuth();
  // État pour gérer l'effet de scroll sur la navbar
  const [scrolled, setScrolled] = useState(false);
  // Compteur de notifications non lues
  const [unreadCount, setUnreadCount] = useState(0);
  // Message de notification toast temporaire
  const [toast, setToast] = useState<string>('');
  // État d'affichage du menu utilisateur déroulant
  const [showUserMenu, setShowUserMenu] = useState(false);
  // État d'affichage de la modal de changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // État d'affichage de la modal de suppression de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Champs du formulaire de changement de mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  // Hook pour récupérer la route actuelle
  const location = useLocation();
  // Référence pour détecter les clics en dehors du menu utilisateur
  const menuRef = useRef<HTMLDivElement>(null);

  // Effect pour gérer l'effet de scroll sur la navbar
  useEffect(() => {
    // Fonction pour détecter le scroll et appliquer la classe 'scrolled'
    const onScroll = () => setScrolled(window.scrollY > 0);
    // Vérification initiale du scroll
    onScroll();
    // Ajout de l'écouteur d'événement scroll avec option passive pour les performances
    window.addEventListener('scroll', onScroll, { passive: true });
    // Nettoyage de l'écouteur lors du démontage du composant
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fonction pour déterminer les classes CSS des liens de navigation selon leur état actif
  const getNavLinkClass: NavLinkProps['className'] = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link';

  // Effect pour gérer les notifications en temps réel
  useEffect(() => {
    // Ne pas exécuter si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) return;

    // Fonction pour récupérer le nombre de notifications non lues
    const fetchUnread = async () => {
      try {
        // Appel API pour récupérer les notifications
        const res = await api.get('/notifications');
        const list = res.data?.data || [];
        // Calcul du nombre de notifications non lues
        const count = (list as any[]).reduce((acc, n: any) => acc + (n.read ? 0 : 1), 0);
        setUnreadCount(count);
      } catch {}
    };

    // Récupération initiale des notifications
    fetchUnread();

    // Mise en place du polling pour vérifier périodiquement les nouvelles notifications
    const id = setInterval(fetchUnread, POLL_MS);

    // Connexion Socket.IO pour les notifications en temps réel
    socketService.connect();
    const unsub = socketService.onNotification((notif) => {
      // Incrémentation du compteur de notifications
      setUnreadCount((c) => c + 1);
      // Génération du message de notification selon le type
      const text = notif.type === 'like'
        ? `${notif.sender?.name || 'Quelqu\'un'} a aimé votre publication`
        : notif.type === 'comment'
          ? `${notif.sender?.name || 'Quelqu\'un'} a commenté votre publication`
          : `${notif.sender?.name || 'Quelqu\'un'} vous a notifié`;
      // Affichage du toast de notification
      setToast(text);
      // Masquage automatique du toast après 4 secondes
      setTimeout(() => setToast(''), 4000);
    });

    // Remise à zéro du compteur quand on consulte la page des notifications
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }

    // Nettoyage lors du démontage du composant
    return () => {
      clearInterval(id); // Arrêt du polling
      unsub(); // Déconnexion des notifications Socket.IO
      // Note: on ne déconnecte pas complètement le socket car d'autres pages peuvent l'utiliser
    };
  }, [isAuthenticated, location.pathname]);

  // Effect pour fermer le menu utilisateur lors d'un clic en dehors
  useEffect(() => {
    // Fonction pour détecter les clics en dehors du menu
    const handleClickOutside = (event: MouseEvent) => {
      // Si le clic est en dehors du menu, le fermer
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    // Ajout de l'écouteur d'événement sur le document
    document.addEventListener('mousedown', handleClickOutside);
    // Nettoyage de l'écouteur lors du démontage
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction pour gérer le changement de mot de passe
  const handleChangePassword = async () => {
    // Vérification que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      // Appel API pour changer le mot de passe
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      // Confirmation du succès
      alert('Mot de passe modifié avec succès');
      // Fermeture de la modal et réinitialisation des champs
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      // Gestion des erreurs
      alert('Erreur lors du changement de mot de passe');
    }
  };

  // Fonction pour gérer la suppression du compte utilisateur
  const handleDeleteAccount = async () => {
    try {
      // Appel API pour supprimer le compte
      await api.delete('/auth/delete-account');
      // Déconnexion automatique après suppression
      logout();
    } catch (error) {
      // Gestion des erreurs de suppression
      alert('Erreur lors de la suppression du compte');
    }
  };

  // Fonction pour confirmer et exécuter la déconnexion
  const confirmLogout = () => {
    // Demande de confirmation avant déconnexion
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  // Fonction pour confirmer la suppression du compte
  const confirmDeleteAccount = () => {
    // Double confirmation pour la suppression de compte (action irréversible)
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) {
      setShowDeleteModal(true);
    }
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-left">
        <Link to="/" className="navbar-brand" aria-label="Accueil CultureBook">
          <span className="brand-icon">🌍</span>
          <span className="brand-text">CultureBook</span>
        </Link>
      </div>

      {isAuthenticated && (
        <div className="nav-center">
          <ul className="nav-center-list">
            <li>
              <NavLink to="/" className={getNavLinkClass} aria-label="Accueil">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink to="/explore" className={getNavLinkClass} aria-label="Explorer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </NavLink>
            </li>
            <li className="hidden-small">
              <NavLink to="/follow" className={getNavLinkClass} aria-label="Communauté">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink to="/notifications" className={getNavLinkClass} aria-label="Notifications" style={{ position: 'relative' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="nav-badge" aria-label={`${unreadCount} notifications non lues`}>{unreadCount}</span>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink to="/messages" className={getNavLinkClass} aria-label="Messages">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </NavLink>
            </li>
            <li className="hidden-small">
              <NavLink to="/marketplace" className={getNavLinkClass} aria-label="Marketplace">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
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

          <div className="user-menu-container" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="nav-action menu-btn" 
              aria-label="Menu utilisateur"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
            {showUserMenu && (
              <div className="user-menu">
                <Link to="/friends" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1h2v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1h2v-1c0-2.21-1.79-4-4-4h-2c-1.1 0-2 .9-2 2 0-1.1-.9-2-2-2H6c-2.21 0-4 1.79-4 4v1h2z"/>
                  </svg>
                  🧑🤝🧑 Amis
                </Link>
                <Link to="/groups" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm2.78 1.58c-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57c0-.81-.48-1.53-1.22-1.85z"/>
                  </svg>
                  👥 Groupes
                </Link>
                <Link to="/saved" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                  💾 Sauvegardés
                </Link>
                <Link to="/marketplace" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                  🛒 Marketplace
                </Link>
                {(user?.role === 'admin' || user?.role === 'superadmin' || localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'superadmin') && (
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
