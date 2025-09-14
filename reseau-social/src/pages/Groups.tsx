import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import './Groups.css';

const Groups = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const allGroups = response.data.data || [];
      console.log('Groupes reçus:', allGroups);
      console.log('User ID:', user?._id);
      
      const joined = allGroups.filter((group: any) => {
        const isMember = group.members?.includes(user?._id);
        const isCreator = group.creator === user?._id || group.creator?._id === user?._id;
        console.log(`Groupe ${group.name}: isMember=${isMember}, isCreator=${isCreator}`);
        return isMember || isCreator;
      });
      const suggestions = allGroups.filter((group: any) => {
        const isMember = group.members?.includes(user?._id);
        const isCreator = group.creator === user?._id || group.creator?._id === user?._id;
        return !isMember && !isCreator;
      });
      
      setMyGroups(joined.map(g => ({ ...g, isJoined: true })));
      setSuggestedGroups(suggestions.map(g => ({ ...g, isJoined: false })));
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const groupToUpdate = suggestedGroups.find(g => g._id === groupId) || myGroups.find(g => g._id === groupId);
      
      if (groupToUpdate?.isJoined) {
        await api.delete(`/groups/${groupId}/leave`);
        setMyGroups(prev => prev.filter(g => g._id !== groupId));
        setSuggestedGroups(prev => 
          prev.map(group => 
            group._id === groupId 
              ? { ...group, isJoined: false }
              : group
          )
        );
      } else {
        await api.post(`/groups/${groupId}/join`);
        const updatedGroup = { ...groupToUpdate, isJoined: true };
        setMyGroups(prev => [...prev, updatedGroup]);
        setSuggestedGroups(prev => 
          prev.map(group => 
            group._id === groupId 
              ? updatedGroup
              : group
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du groupe:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      try {
        const response = await api.post('/groups', {
          name: newGroupName,
          description: newGroupDescription
        });
        
        const newGroup = { ...response.data.data, isJoined: true };
        setMyGroups(prev => [...prev, newGroup]);
        // Retirer des suggestions si présent
        setSuggestedGroups(prev => prev.filter(g => g._id !== newGroup._id));
        setNewGroupName('');
        setNewGroupDescription('');
        setShowCreateModal(false);
      } catch (error: any) {
        console.error('Erreur lors de la création du groupe:', error);
        alert('Erreur lors de la création du groupe');
      }
    }
  };

  return (
    <div className="groups-page">
      <div className="groups-header">
        <h1>👥 Groupes</h1>
        <p>Rejoignez des communautés culturelles</p>
      </div>

      <div className="groups-actions">
        <button className="create-group-btn" onClick={() => setShowCreateModal(true)}>
          ➕ Créer un groupe
        </button>
      </div>

      <div className="groups-sections">
        <div className="section">
          <h2>Mes groupes ({myGroups.length})</h2>
          <div className="groups-grid">
            {myGroups.length === 0 ? (
              <p className="empty-state">Vous n'avez rejoint aucun groupe</p>
            ) : (
              myGroups.map(group => (
                <div key={group._id} className="group-card" onClick={() => window.location.href = `/groups/${group._id}`}>
                  <h3>{group.name}</h3>
                  <p>{group.description}</p>
                  <p className="members-count">{Array.isArray(group.members) ? group.members.length : group.members || 0} membres</p>
                  <div className="group-card-actions" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/groups/${group._id}`} className="view-group-btn">
                      Voir le groupe
                    </Link>
                    <button className="join-btn joined" onClick={() => handleJoinGroup(group._id)}>
                      Quitter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h2>Groupes suggérés</h2>
          <div className="groups-grid">
            {suggestedGroups.map(group => (
              <div key={group._id} className="group-card" onClick={() => group.isJoined && (window.location.href = `/groups/${group._id}`)}>
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <p className="members-count">{Array.isArray(group.members) ? group.members.length : group.members || 0} membres</p>
                <div className="group-card-actions" onClick={(e) => e.stopPropagation()}>
                  {group.isJoined && (
                    <Link to={`/groups/${group._id}`} className="view-group-btn">
                      Voir le groupe
                    </Link>
                  )}
                  <button 
                    className={`join-btn ${group.isJoined ? 'joined' : ''}`}
                    onClick={() => handleJoinGroup(group._id)}
                  >
                    {group.isJoined ? 'Rejoint' : 'Rejoindre'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Créer un nouveau groupe</h3>
            <input
              type="text"
              placeholder="Nom du groupe"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="modal-input"
            />
            <textarea
              placeholder="Description du groupe"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="modal-textarea"
              rows={3}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="cancel-btn">
                Annuler
              </button>
              <button onClick={handleCreateGroup} className="create-btn">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;