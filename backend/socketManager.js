const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

let onlineUsers = new Map(); // Map pour stocker userId -> socketId

const initializeSocket = (io) => {
    // Expose onlineUsers on io for controllers (if needed)
    io.onlineUsers = onlineUsers;

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

        // Room privée pour notifications ciblées
        socket.join(socket.user.id.toString());

        // Ajouter l'utilisateur à la liste des utilisateurs en ligne
        onlineUsers.set(socket.user.id.toString(), socket.id);

        // Émettre la liste des utilisateurs en ligne à tous les clients
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));

        // Gérer l'envoi de messages
        socket.on('sendMessage', async ({ receiverId, content }) => {
            try {
                // Trouver ou créer la conversation
                let conversation = await Conversation.findOne({
                    participants: { $all: [socket.user.id, receiverId] }
                });

                if (!conversation) {
                    conversation = await Conversation.create({ participants: [socket.user.id, receiverId] });
                }

                // Créer le message avec readBy pour l'expéditeur
                const newMessage = await Message.create({ 
                    conversation: conversation._id, 
                    sender: socket.user.id, 
                    content,
                    readBy: [{
                        user: socket.user.id,
                        readAt: new Date()
                    }]
                });
                
                await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: newMessage._id });

                // Peupler le message avec les infos du sender
                const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name');

                // Envoyer le message au destinataire
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newMessage', populatedMessage);
                }
                
                // Confirmer l'envoi à l'expéditeur
                socket.emit('messageConfirmed', populatedMessage);
            } catch (error) {
                console.error("Erreur lors de l'envoi du message:", error);
                socket.emit('messageError', { error: 'Erreur lors de l\'envoi du message' });
            }
        });

        // Gérer l'indicateur de frappe
        socket.on('typing', ({ conversationId }) => {
            socket.to(conversationId).emit('userTyping', {
                userId: socket.user.id,
                name: socket.user.name
            });
        });

        socket.on('stopTyping', ({ conversationId }) => {
            socket.to(conversationId).emit('userStoppedTyping', {
                userId: socket.user.id
            });
        });

        // Rejoindre les conversations de l'utilisateur
        socket.on('joinConversations', async () => {
            try {
                const conversations = await Conversation.find({ participants: socket.user.id });
                conversations.forEach(conv => {
                    socket.join(conv._id.toString());
                });
            } catch (error) {
                console.error('Erreur lors de la jointure des conversations:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Utilisateur déconnecté: ${socket.user.name} (${socket.id})`);
            onlineUsers.delete(socket.user.id.toString());
            io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        });
    });

    return onlineUsers;
};

module.exports = initializeSocket;