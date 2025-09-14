import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import './GroupDetail.css';

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    if (showInviteModal) {
      fetchContacts();
    }
  }, [showInviteModal]);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/users/contacts');
      setContacts(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const groupResponse = await api.get(`/groups/${groupId}`);
      setGroup(groupResponse.data.data);
      
      const membersResponse = await api.get(`/groups/${groupId}/members`);
      setMembers(membersResponse.data.data || []);
      
      const postsResponse = await api.get(`/groups/${groupId}/posts`);
      setPosts(postsResponse.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du groupe:', error);
    }
  };

  const handleCreatePost = async (content: string, type: 'Proverbe' | 'Conte' | 'Histoire', mediaFile?: File, language?: string, region?: string) => {
    try {
      const formData = new FormData();
      formData.append('textContent', content);
      formData.append('type', type);
      formData.append('language', language || 'Français');
      formData.append('region', region || 'Conakry');
      formData.append('groupId', groupId || '');
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPosts(prev => [response.data.data, ...prev]);
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
      alert('Erreur lors de la publication');
    }
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedContacts.length > 0) {
      try {
        await api.post(`/groups/${groupId}/invite`, {
          userIds: selectedContacts
        });
        
        const invitedNames = contacts
          .filter(contact => selectedContacts.includes(contact._id))
          .map(contact => contact.name)
          .join(', ');
        
        alert(`Invitations envoyées à : ${invitedNames}`);
        
        setContacts(prev => 
          prev.map(contact => 
            selectedContacts.includes(contact._id) 
              ? { ...contact, isInvited: true }
              : contact
          )
        );
        
        setSelectedContacts([]);
        setShowInviteModal(false);
      } catch (error) {
        console.error('Erreur lors de l\'invitation:', error);
        alert('Erreur lors de l\'envoi des invitations');
      }
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleLikeToggle = (postId: string) => {
    setPosts(prev => 
      prev.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(user?._id || '');
          const newLikes = isLiked 
            ? post.likes.filter(id => id !== user?._id)
            : [...post.likes, user?._id || ''];
          return { ...post, likes: newLikes };
        }
        return post;
      })
    );
  };

  const handleCommentSubmit = async (postId: string, content: string) => {
    // Simuler l'ajout d'un commentaire
    console.log(`Commentaire ajouté sur le post ${postId}: ${content}`);
    return Promise.resolve();
  };

  if (!group) return <div>Chargement...</div>;

  return (
    <div className="group-detail">
      <div className="group-header">
        <div className="group-info">
          <h1>{group.name}</h1>
          <p>{group.description}</p>
          <div className="group-stats">
            <span>{Array.isArray(group.members) ? group.members.length : group.members || 0} membres</span>
            <span>•</span>
            <span>{posts.length} publications</span>
          </div>
        </div>
        
        {group.isAdmin && (
          <div className="group-actions">
            <button 
              className="invite-btn"
              onClick={() => setShowInviteModal(true)}
            >
              ➕ Inviter des membres
            </button>
          </div>
        )}
      </div>

      <div className="group-content">
        <div className="group-main">
          <div className="create-post-section">
            <h3>Publier dans le groupe</h3>
            <CreatePost onPostSubmit={handleCreatePost} />
          </div>

          <div className="group-posts">
            <h3>Publications du groupe</h3>
            {posts.length === 0 ? (
              <div className="empty-posts">
                <p>Aucune publication dans ce groupe</p>
                <p>Soyez le premier à partager quelque chose !</p>
              </div>
            ) : (
              posts.map(post => (
                <Post
                  key={post._id}
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onCommentSubmit={handleCommentSubmit}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>
        </div>

        <div className="group-sidebar">
          <div className="members-section">
            <h3>Membres ({members.length})</h3>
            <div className="members-list">
              {members.map(member => (
                <div key={member._id} className="member-item">
                  <div className="member-avatar">👤</div>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    {member.role === 'admin' && (
                      <span className="admin-badge">Admin</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content invite-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Inviter des membres</h3>
            <p className="modal-subtitle">Sélectionnez les personnes à inviter dans le groupe</p>
            
            <div className="contacts-list">
              {contacts.map(contact => (
                <div key={contact._id} className="contact-item">
                  <div className="contact-info">
                    <div className="contact-avatar">👤</div>
                    <div className="contact-details">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-type">
                        {contact.type === 'following' ? 'Vous suivez' : 'Vous suit'}
                      </span>
                    </div>
                  </div>
                  
                  {contact.isInvited ? (
                    <span className="invited-badge">Invité</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact._id)}
                      onChange={() => handleToggleContact(contact._id)}
                      className="contact-checkbox"
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowInviteModal(false)} className="cancel-btn">
                Annuler
              </button>
              <button 
                onClick={handleSendInvitations} 
                className="invite-confirm-btn"
                disabled={selectedContacts.length === 0}
              >
                Inviter ({selectedContacts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;