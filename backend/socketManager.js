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
        socket.on('sendMessage', async ({ receiverId, content }) => {
            try {
                // Trouver ou créer la conversation
                let conversation = await Conversation.findOne({
                    participants: { $all: [socket.user.id, receiverId] }
                });

                if (!conversation) {
                    conversation = await Conversation.create({ participants: [socket.user.id, receiverId] });
                }

                const newMessage = await Message.create({ conversation: conversation._id, sender: socket.user.id, content });
                await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: newMessage._id });

                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newMessage', newMessage);
                }
            } catch (error) {
                console.error("Erreur lors de l'envoi du message:", error);
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