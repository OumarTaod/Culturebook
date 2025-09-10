const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

let onlineUsers = new Map(); // Map pour stocker userId -> socketId

const initializeSocket = (io) => {
    // Middleware d'authentification pour Socket.IO
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token not provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.user = user;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Un utilisateur s'est connecté: ${socket.user.name} (${socket.id})`);

        // Chaque utilisateur rejoint une room privée avec son ID pour les notifications ciblées
        socket.join(socket.user.id.toString());

        // Ajouter l'utilisateur à la liste des utilisateurs en ligne
        onlineUsers.set(socket.user.id.toString(), socket.id);

        // Émettre la liste des utilisateurs en ligne à tous les clients
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));

        // Gérer l'envoi de messages
        socket.on('sendMessage', async ({ conversationId, content }) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (!conversation || !conversation.participants.includes(socket.user.id)) {
                    throw new Error('Conversation non trouvée ou accès non autorisé');
                }

                // Créer le nouveau message
                const message = await Message.create({
                    conversation: conversationId,
                    sender: socket.user.id,
                    content
                });

                // Mettre à jour le dernier message de la conversation
                conversation.lastMessage = message._id;
                await conversation.save();

                // Peupler les informations du sender pour la réponse
                await message.populate('sender', 'name');

                // Envoyer le message à tous les participants de la conversation
                conversation.participants.forEach(participantId => {
                    io.to(participantId.toString()).emit('newMessage', {
                        conversationId,
                        message: {
                            _id: message._id,
                            sender: message.sender,
                            content: message.content,
                            createdAt: message.createdAt
                        }
                    });
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
                socket.emit('messageError', { error: error.message });
            }
        });

        // Gérer la saisie en cours
        socket.on('typing', ({ conversationId }) => {
            socket.to(conversationId).emit('userTyping', {
                userId: socket.user.id,
                name: socket.user.name
            });
        });

        socket.on('stopTyping', ({ conversationId }) => {
            socket.to(conversationId).emit('userStopTyping', {
                userId: socket.user.id
            });
        });

        // Gérer la déconnexion
        socket.on('disconnect', () => {
            console.log(`Un utilisateur s'est déconnecté: ${socket.user.name}`);
            onlineUsers.delete(socket.user.id.toString());
            io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        });
    });
};

module.exports = initializeSocket;