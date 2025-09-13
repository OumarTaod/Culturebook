import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import './Admin.css';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalMessages: number;
  newUsersToday: number;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalMessages: 0, newUsersToday: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur est admin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data:', data);
        setStats(data.data);
      } else {
        const errorData = await response.text();
        console.error('Erreur API:', response.status, errorData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Posts response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Posts data:', data);
        setPosts(data.data || []);
      } else {
        const errorData = await response.text();
        console.error('Erreur API posts:', response.status, errorData);
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
      const token = localStorage.getItem('token');
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
          Tableau de bord
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
        <button 
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
      </div>

      <div className="admin-content">
        {loading && <div className="loading">Chargement...</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Utilisateurs totaux</h3>
                <div className="stat-number">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <h3>Posts totaux</h3>
                <div className="stat-number">{stats.totalPosts}</div>
              </div>
              <div className="stat-card">
                <h3>Messages totaux</h3>
                <div className="stat-number">{stats.totalMessages}</div>
              </div>
              <div className="stat-card">
                <h3>Nouveaux utilisateurs aujourd'hui</h3>
                <div className="stat-number">{stats.newUsersToday}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <h2>Gestion des utilisateurs</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Abonnés</th>
                    <th>Inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
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
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteUser(u._id)}
                          disabled={u.role === 'superadmin' && user.role !== 'superadmin'}
                        >
                          Supprimer
                        </button>
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
            <h2>Gestion des posts</h2>
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
                    <span>{post.likes?.length || 0} likes</span>
                    <span>{post.comments?.length || 0} commentaires</span>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => deletePost(post._id)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;