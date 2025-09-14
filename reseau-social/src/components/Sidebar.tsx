import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>Navigation</h3>
        <Link 
          to="/friends" 
          className={`sidebar-link ${isActive('/friends') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">🧑🤝🧑</span>
          <span>Amis</span>
        </Link>
        
        <Link 
          to="/groups" 
          className={`sidebar-link ${isActive('/groups') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">👥</span>
          <span>Groupes</span>
        </Link>
        
        <Link 
          to="/saved" 
          className={`sidebar-link ${isActive('/saved') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">💾</span>
          <span>Sauvegardés</span>
        </Link>
        
        <Link 
          to="/marketplace" 
          className={`sidebar-link ${isActive('/marketplace') ? 'active' : ''}`}
        >
          <span className="sidebar-icon">🛒</span>
          <span>Marketplace</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <h3>Raccourcis</h3>
        <Link to="/explore" className={`sidebar-link ${isActive('/explore') ? 'active' : ''}`}>
          <span className="sidebar-icon">🔍</span>
          <span>Explorer</span>
        </Link>
        
        <Link to="/follow" className={`sidebar-link ${isActive('/follow') ? 'active' : ''}`}>
          <span className="sidebar-icon">👥</span>
          <span>Communauté</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;