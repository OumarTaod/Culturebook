import { Link, NavLink } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getNavLinkClass: NavLinkProps['className'] = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <nav className={`navbar fb${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-left">
        <Link to="/" className="navbar-brand" aria-label="Accueil CultureBook">
          CultureBook
        </Link>
        <div className="nav-search">
          <input type="text" placeholder="Rechercher sur CultureBook" aria-label="Recherche" />
        </div>
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
              <NavLink to="/discover" className={getNavLinkClass} aria-label="Découvrir">
                🔎
              </NavLink>
            </li>
            <li>
              <NavLink to="/notifications" className={getNavLinkClass} aria-label="Notifications">
                🔔
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
    </nav>
  );
};

export default Navbar;
