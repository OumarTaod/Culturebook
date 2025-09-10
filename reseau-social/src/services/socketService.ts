import { io, Socket } from 'socket.io-client';

// Function to retrieve the authentication token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

interface Message {
  _id: string;
  conversation: string; // conversation id from backend
  sender: {
    _id: string;
    name: string;
  };
  content: string;
  createdAt: string;
}

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private typingHandlers: ((data: { userId: string; name: string }) => void)[] = [];
  private stopTypingHandlers: ((data: { userId: string }) => void)[] = [];
  private onlineUsersHandlers: ((users: string[]) => void)[] = [];

  connect() {
    if (this.socket?.connected) return;

    const token = getToken();
    if (!token) return;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5050', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
    });

    // Le backend émet directement l'objet message
    this.socket.on('newMessage', (message: Message) => {
      this.messageHandlers.forEach((handler) => handler(message));
    });

    // Événements potentiels non implémentés côté backend, conservés pour compatibilité future
    this.socket.on('userTyping', (data) => {
      this.typingHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('userStopTyping', (data) => {
      this.stopTypingHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('onlineUsers', (users: string[]) => {
      this.onlineUsersHandlers.forEach((handler) => handler(users));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Le backend attend receiverId et content
  sendMessage(receiverId: string, content: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('sendMessage', { receiverId, content });
  }

  // Typing helpers (non pris en charge côté backend actuel)
  startTyping(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { conversationId });
  }

  stopTyping(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('stopTyping', { conversationId });
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onTyping(handler: (data: { userId: string; name: string }) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter((h) => h !== handler);
    };
  }

  onStopTyping(handler: (data: { userId: string }) => void) {
    this.stopTypingHandlers.push(handler);
    return () => {
      this.stopTypingHandlers = this.stopTypingHandlers.filter((h) => h !== handler);
    };
  }

  onOnlineUsers(handler: (users: string[]) => void) {
    this.onlineUsersHandlers.push(handler);
    return () => {
      this.onlineUsersHandlers = this.onlineUsersHandlers.filter((h) => h !== handler);
    };
  }
}

export const socketService = new SocketService();
