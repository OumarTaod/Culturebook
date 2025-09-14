import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './MobileNav.css';

const MobileNav = () => {
  const { user } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'mobile-nav-link active' : 'mobile-nav-link';

  return (
    <nav className="mobile-nav">
      <NavLink to="/" className={getNavLinkClass}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
        <span>Accueil</span>
      </NavLink>
      
      <NavLink to="/explore" className={getNavLinkClass}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Explorer</span>
      </NavLink>
      
      <NavLink to="/notifications" className={getNavLinkClass}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span>Notifications</span>
      </NavLink>
      
      <NavLink to="/messages" className={getNavLinkClass}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Messages</span>
      </NavLink>
      
      <NavLink to={`/profile/${user?._id}`} className={getNavLinkClass}>
        <div className="mobile-avatar">
          {user?.name?.[0] || 'U'}
        </div>
        <span>Profil</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;