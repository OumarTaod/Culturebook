import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import { socketService } from '../services/socketService';
import './Messages.css';

interface Message {
  _id: string;
  conversation: string;
  content: string;
  sender: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUserIdRef = useRef<string | null>(null);
  
  selectedConversationRef.current = selectedConversation;
  currentUserIdRef.current = user?._id || null;

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des conversations');
      console.error(err);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}`);
      setMessages(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des messages');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    socketService.connect();

    const unsubscribe = socketService.onMessage(async (message: Message) => {
      // Mettre à jour la liste des conversations (remonter celle impactée)
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === message.conversation);
        if (idx === -1) return prev; // Inconnu => laisser tel quel
        const copy = [...prev];
        const conv = { ...copy[idx] };
        conv.lastMessage = { content: message.content, createdAt: message.createdAt };
        copy.splice(idx, 1);
        return [conv, ...copy];
      });

      // Si on regarde cette conversation, ajouter le message directement
      if (selectedConversationRef.current === message.conversation) {
        setMessages(prev => {
          // Supprimer les messages temporaires et ajouter le nouveau
          const withoutTemp = prev.filter(m => !m._id.startsWith('temp-'));
          const exists = withoutTemp.some(m => m._id === message._id);
          if (exists) return prev;
          return [...withoutTemp, message];
        });
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    const onlineUsersUnsubscribe = socketService.onOnlineUsers((users) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      onlineUsersUnsubscribe();
      // Ne pas déconnecter le socket complètement, juste nettoyer les handlers
    };
  }, [fetchConversations, fetchMessages]);

  // Ouvrir automatiquement une conversation si on vient d'un profil
  useEffect(() => {
    const state = location.state as any;
    if (state?.openConversationId) {
      setSelectedConversation(state.openConversationId);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    // Trouver l'autre participant pour déterminer le receiverId
    const conv = conversations.find((c) => c._id === selectedConversation);
    const other = conv?.participants.find((p) => p._id !== user?._id);
    const receiverId = other?._id;
    if (!receiverId) return;

    const messageContent = newMessage.trim();
    
    // Créer un message temporaire pour l'affichage immédiat
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversation: selectedConversation,
      content: messageContent,
      sender: {
        _id: user!._id,
        name: user!.name
      },
      createdAt: new Date().toISOString()
    };

    // Ajouter immédiatement le message à l'affichage
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      socketService.sendMessage(receiverId, messageContent);
    } catch (err) {
      // En cas d'erreur, retirer le message temporaire
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setError("Erreur lors de l'envoi du message");
      console.error(err);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find((p) => p._id !== user?._id);
    return otherParticipant?.name || 'Utilisateur';
  };

  const isUserOnline = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find((p) => p._id !== user?._id);
    return !!(otherParticipant && onlineUsers.includes(otherParticipant._id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv => 
    getOtherParticipant(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <div className="conversations-header">
          <h2>Messages</h2>
          <button className="new-chat-btn">✏️</button>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {filteredConversations.map((conversation) => (
          <div
            key={conversation._id}
            className={`conversation-item ${selectedConversation === conversation._id ? 'selected' : ''}`}
            onClick={() => setSelectedConversation(conversation._id)}
          >
            <div className="conversation-avatar">
              {getOtherParticipant(conversation)[0]?.toUpperCase()}
              {isUserOnline(conversation) && <span className="online-dot" />}
            </div>
            <div className="conversation-info">
              <div className="conversation-header">
                <div className="conversation-name">
                  {getOtherParticipant(conversation)}
                </div>
                {conversation.lastMessage && (
                  <div className="conversation-time">{formatDate(conversation.lastMessage.createdAt)}</div>
                )}
              </div>
              {conversation.lastMessage && (
                <div className="conversation-last-message">{conversation.lastMessage.content}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="messages-content">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-avatar">
                  {conversations.find(c => c._id === selectedConversation) && 
                    getOtherParticipant(conversations.find(c => c._id === selectedConversation)!)[0]?.toUpperCase()}
                </div>
                <div className="chat-details">
                  <div className="chat-name">
                    {conversations.find(c => c._id === selectedConversation) && 
                      getOtherParticipant(conversations.find(c => c._id === selectedConversation)!)}
                  </div>
                  <div className="chat-status">
                    {conversations.find(c => c._id === selectedConversation) && 
                      isUserOnline(conversations.find(c => c._id === selectedConversation)!) ? 'En ligne' : 'Hors ligne'}
                  </div>
                </div>
              </div>
              <div className="chat-actions">
                <button className="chat-action-btn">📞</button>
                <button className="chat-action-btn">📹</button>
                <button className="chat-action-btn">⋮</button>
              </div>
            </div>
            <div className="messages-list">
              {messages.map((message) => {
                // Logique simplifiée : si c'est l'utilisateur actuel, c'est envoyé
                const isSent = message.sender._id === user?._id;
                
                return (
                  <div key={message._id} className={`message ${isSent ? 'sent' : 'received'}`}>
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">{formatDate(message.createdAt)}</div>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-container">
              <button type="button" className="attachment-btn">📎</button>
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tapez un message..."
                className="message-input"
              />
              <button type="button" className="emoji-btn">😊</button>
              <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                {newMessage.trim() ? '➤' : '🎤'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation-selected">Sélectionnez une conversation pour commencer à discuter</div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Messages;
