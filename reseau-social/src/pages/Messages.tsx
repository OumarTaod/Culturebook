import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import { socketService } from '../services/socketService';
import './Messages.css';

interface Message {
  _id: string;
  conversation: string; // conversation id from backend
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
  const messageEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<string | null>(null);
  selectedConversationRef.current = selectedConversation;

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

      // Si on regarde cette conversation, rafraîchir
      if (selectedConversationRef.current === message.conversation) {
        await fetchMessages(message.conversation);
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    const onlineUsersUnsubscribe = socketService.onOnlineUsers((users) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      onlineUsersUnsubscribe();
      socketService.disconnect();
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

    try {
      socketService.sendMessage(receiverId, newMessage.trim());
      setNewMessage('');
    } catch (err) {
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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <h2>Conversations</h2>
        {conversations.map((conversation) => (
          <div
            key={conversation._id}
            className={`conversation-item ${selectedConversation === conversation._id ? 'selected' : ''}`}
            onClick={() => setSelectedConversation(conversation._id)}
          >
            <div className="conversation-header">
              <div className="conversation-name">
                {getOtherParticipant(conversation)}
                {isUserOnline(conversation) && <span className="online-indicator" />}
              </div>
              {conversation.lastMessage && (
                <div className="conversation-time">{formatDate(conversation.lastMessage.createdAt)}</div>
              )}
            </div>
            {conversation.lastMessage && (
              <div className="conversation-last-message">{conversation.lastMessage.content}</div>
            )}
          </div>
        ))}
      </div>

      <div className="messages-content">
        {selectedConversation ? (
          <>
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message._id} className={`message ${message.sender._id === user?._id ? 'sent' : 'received'}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">{formatDate(message.createdAt)}</div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="message-input"
              />
              <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                Envoyer
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
