import { Link, NavLink } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  // Helper function to avoid repetition for NavLink classes
  const getNavLinkClass: NavLinkProps['className'] = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        CultureBook
      </Link>
      {isAuthenticated && (
        <div className="navbar-right">
          <ul className="navbar-nav">
            <li><NavLink to="/" className={getNavLinkClass}>Accueil</NavLink></li>
            <li><NavLink to="/follow" className={getNavLinkClass}>Suivre</NavLink></li>
            <li><NavLink to="/notifications" className={getNavLinkClass}>Notifications</NavLink></li>
            <li><NavLink to="/messages" className={getNavLinkClass}>Messages</NavLink></li>
            <li><NavLink to={`/profile/${user?._id}`} className={getNavLinkClass}>Profil</NavLink></li>
          </ul>
          <div className="navbar-user">
            <span>Bonjour, {user?.name}</span>
            <button onClick={logout} className="logout-button">Déconnexion</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
