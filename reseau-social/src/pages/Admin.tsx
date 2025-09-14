import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import './Admin.css';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalMessages: number;
  newUsersToday: number;
  totalGroups?: number;
  activeUsers?: number;
  bannedUsers?: number;
  postsToday?: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  followers: string[];
  following: string[];
}

interface Post {
  _id: string;
  content: string;
  type?: string;
  language?: string;
  region?: string;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
  likes: string[];
  comments: any[];
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts' | 'groups' | 'reports' | 'settings'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalMessages: 0, newUsersToday: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Fonction utilitaire pour récupérer le token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token d\'authentification manquant');
      return null;
    }
    return token;
  };

  // Vérifier si l'utilisateur est admin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        fetchStats();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'posts':
        fetchPosts();
        break;
      case 'groups':
        fetchGroups();
        break;
      case 'reports':
        fetchReports();
        break;
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        console.error('Erreur API stats:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
    setLoading(false);
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setGroups([]);
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data.data || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
      setGroups([]);
    }
    setLoading(false);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setReports([]);
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
      setReports([]);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setUsers([]);
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        console.error('Erreur API users:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setPosts([]);
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.data || []);
      } else {
        console.error('Erreur API posts:', response.status);
        setPosts([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
      setPosts([]);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        fetchUsers();
        alert('Rôle mis à jour avec succès');
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchUsers();
        alert('Utilisateur supprimé avec succès');
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;
    
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch(`http://localhost:5000/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchPosts();
        alert('Post supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const banUser = async (userId: string, banned: boolean) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ banned })
      });
      
      if (response.ok) {
        fetchUsers();
        alert(`Utilisateur ${banned ? 'banni' : 'débanni'} avec succès`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;
    
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch(`http://localhost:5000/api/admin/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchGroups();
        alert('Groupe supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleReport = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        fetchReports();
        alert(`Signalement ${action === 'approve' ? 'approuvé' : 'rejeté'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du traitement');
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Administration</h1>
        <p>Bienvenue, {user.name} ({user.role})</p>
      </div>

      <div className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tableau de bord
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs
        </button>
        <button 
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          📝 Posts
        </button>
        <button 
          className={activeTab === 'groups' ? 'active' : ''}
          onClick={() => setActiveTab('groups')}
        >
          👥 Groupes
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          🚨 Signalements
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Paramètres
        </button>
      </div>

      <div className="admin-content">
        {loading && <div className="loading">Chargement...</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>👥 Utilisateurs totaux</h3>
                <div className="stat-number">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <h3>📝 Posts totaux</h3>
                <div className="stat-number">{stats.totalPosts}</div>
              </div>
              <div className="stat-card">
                <h3>💬 Messages totaux</h3>
                <div className="stat-number">{stats.totalMessages}</div>
              </div>
              <div className="stat-card">
                <h3>✨ Nouveaux aujourd'hui</h3>
                <div className="stat-number">{stats.newUsersToday}</div>
              </div>
              <div className="stat-card">
                <h3>👥 Groupes actifs</h3>
                <div className="stat-number">{stats.totalGroups || 0}</div>
              </div>
              <div className="stat-card">
                <h3>🔄 Utilisateurs actifs</h3>
                <div className="stat-number">{stats.activeUsers || 0}</div>
              </div>
            </div>
            <div className="quick-actions" style={{marginTop: '30px'}}>
              <h3>Actions rapides</h3>
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px'}}>
                <button onClick={() => setActiveTab('users')} className="quick-btn">
                  👥 Gérer les utilisateurs
                </button>
                <button onClick={() => setActiveTab('posts')} className="quick-btn">
                  📝 Modérer les posts
                </button>
                <button onClick={() => setActiveTab('reports')} className="quick-btn">
                  🚨 Voir les signalements
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <div className="section-header">
              <h2>👥 Gestion des utilisateurs</h2>
              <div className="filters">
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="user">Utilisateurs</option>
                  <option value="admin">Admins</option>
                  <option value="superadmin">Super Admins</option>
                </select>
              </div>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Abonnés</th>
                    <th>Statut</th>
                    <th>Inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <select 
                          value={u.role} 
                          onChange={(e) => updateUserRole(u._id, e.target.value)}
                          disabled={u.role === 'superadmin' && user.role !== 'superadmin'}
                        >
                          <option value="user">Utilisateur</option>
                          <option value="admin">Admin</option>
                          {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                        </select>
                      </td>
                      <td>{u.followers.length}</td>
                      <td>
                        <span className={`status ${(u as any).banned ? 'banned' : 'active'}`}>
                          {(u as any).banned ? '🚫 Banni' : '✅ Actif'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className={`ban-btn ${(u as any).banned ? 'unban' : 'ban'}`}
                            onClick={() => banUser(u._id, !(u as any).banned)}
                            disabled={u.role === 'superadmin' && user.role !== 'superadmin'}
                          >
                            {(u as any).banned ? 'Débannir' : 'Bannir'}
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => deleteUser(u._id)}
                            disabled={u.role === 'superadmin' && user.role !== 'superadmin'}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-management">
            <h2>📝 Gestion des posts</h2>
            {posts.length === 0 && !loading && (
              <p>Aucun post trouvé.</p>
            )}
            <div className="posts-grid">
              {posts.map(post => (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <strong>{post.author?.name || 'Auteur inconnu'}</strong>
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Date inconnue'}</span>
                  </div>
                  {(post.type || post.language || post.region) && (
                    <div className="post-meta">
                      {post.type && <span className="post-type">{post.type}</span>}
                      {post.language && <span className="post-language">{post.language}</span>}
                      {post.region && <span className="post-region">{post.region}</span>}
                    </div>
                  )}
                  <div className="post-content">
                    {post.content ? post.content.substring(0, 150) : 'Contenu non disponible'}
                    {post.content && post.content.length > 150 && '...'}
                  </div>
                  <div className="post-stats">
                    <span>❤️ {post.likes?.length || 0} likes</span>
                    <span>💬 {post.comments?.length || 0} commentaires</span>
                  </div>
                  <div className="post-actions">
                    <button className="view-btn" onClick={() => window.open(`/post/${post._id}`, '_blank')}>
                      👁️ Voir
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deletePost(post._id)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="groups-management">
            <h2>👥 Gestion des groupes</h2>
            {groups.length === 0 && !loading && (
              <p>Aucun groupe trouvé.</p>
            )}
            <div className="groups-grid">
              {groups.map(group => (
                <div key={group._id} className="group-card">
                  <div className="group-header">
                    <h3>{group.name}</h3>
                    <span className="group-privacy">{group.privacy === 'public' ? '🌍 Public' : '🔒 Privé'}</span>
                  </div>
                  <p className="group-description">{group.description}</p>
                  <div className="group-stats">
                    <span>👥 {group.members?.length || 0} membres</span>
                    <span>📅 Créé le {new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="group-actions">
                    <button className="view-btn" onClick={() => window.open(`/groups/${group._id}`, '_blank')}>
                      👁️ Voir
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteGroup(group._id)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-management">
            <h2>🚨 Gestion des signalements</h2>
            {reports.length === 0 && !loading && (
              <p>Aucun signalement en attente.</p>
            )}
            <div className="reports-list">
              {reports.map(report => (
                <div key={report._id} className="report-card">
                  <div className="report-header">
                    <span className="report-type">{report.type}</span>
                    <span className="report-date">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="report-content">
                    <p><strong>Signalement:</strong> {report.reason}</p>
                    <p><strong>Par:</strong> {report.reporter?.name}</p>
                    <p><strong>Contenu signalé:</strong> {report.content?.substring(0, 100)}...</p>
                  </div>
                  <div className="report-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => handleReport(report._id, 'approve')}
                    >
                      ✅ Approuver
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReport(report._id, 'reject')}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-management">
            <h2>⚙️ Paramètres du site</h2>
            <div className="settings-sections">
              <div className="setting-section">
                <h3>Paramètres généraux</h3>
                <div className="setting-item">
                  <label>Nom du site:</label>
                  <input type="text" defaultValue="Réseau Social" className="setting-input" />
                </div>
                <div className="setting-item">
                  <label>Description:</label>
                  <textarea defaultValue="Plateforme de réseautage social" className="setting-textarea"></textarea>
                </div>
              </div>
              
              <div className="setting-section">
                <h3>Modération</h3>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> 
                    Modération automatique des posts
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> 
                    Notifications des signalements
                  </label>
                </div>
              </div>
              
              <div className="setting-section">
                <h3>Sécurité</h3>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> 
                    Authentification à deux facteurs obligatoire pour les admins
                  </label>
                </div>
                <div className="setting-item">
                  <label>Durée de session (minutes):</label>
                  <input type="number" defaultValue="60" className="setting-input" />
                </div>
              </div>
              
              <button className="save-settings-btn">
                💾 Sauvegarder les paramètres
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;