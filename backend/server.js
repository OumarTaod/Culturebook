const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Liste des types MIME autorisés pour les images, vidéos et audios
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/avi', 'video/mov',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accepter le fichier
    } else {
      // Rejeter le fichier avec une erreur
      cb(new Error('Type de fichier non supporté. Seuls les images, vidéos et fichiers audio sont autorisés.'));
    }
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Stockage en mémoire (remplace MongoDB)
let users = [
  {
    _id: 'user1',
    name: 'Utilisateur Demo',
    email: 'demo@culturebook.com',
    password: '$2b$10$rQZ9vXqZ9vXqZ9vXqZ9vXO', // password: demo123
    following: [],
    followers: [],
    avatarUrl: '',
    coverUrl: '',
    bio: ''
  }
];

let posts = [];
let notifications = [];
let conversations = [];
let messages = [];

// JWT Secret
const JWT_SECRET = 'culturebook-secret-key-2024';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Tentative de connexion:', { email });
    
    // Vérifier si l'utilisateur existe
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        following: user.following || []
      },
      token
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('Tentative d\'inscription:', { name, email });
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer nouvel utilisateur
    const newUser = {
      _id: 'user' + Date.now(),
      name,
      email,
      password: await bcrypt.hash(password, 10),
      following: [],
      followers: [],
      avatarUrl: '',
      coverUrl: '',
      bio: ''
    };
    
    users.push(newUser);

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        following: newUser.following
      },
      token
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes des posts
app.get('/api/posts', (req, res) => {
  try {
    console.log('GET /api/posts - Récupération des posts');
    
    // Retourner les posts triés par date (plus récent en premier)
    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: sortedPosts
    });
  } catch (error) {
    console.error('Erreur récupération posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

app.post('/api/posts', authenticateToken, upload.single('media'), (req, res) => {
  try {
    const { type, language, region, textContent } = req.body;
    const userId = req.user.userId;
    
    console.log('POST /api/posts:', { type, language, region, textContent, file: req.file });
    
    if (!textContent || !textContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu texte est requis'
      });
    }

    // Trouver l'utilisateur
    const user = users.find(u => u._id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Créer le nouveau post
    const newPost = {
      _id: 'post-' + Date.now(),
      author: {
        _id: user._id,
        name: user.name
      },
      type: type || 'Conte',
      language: language || 'Français',
      region: region || 'Non spécifié',
      textContent: textContent.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };

    // Ajouter les URLs de média si un fichier a été uploadé
    if (req.file) {
      const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
      
      if (req.file.mimetype.startsWith('image/')) {
        newPost.imageUrl = fileUrl;
      } else if (req.file.mimetype.startsWith('video/')) {
        newPost.videoUrl = fileUrl;
      } else if (req.file.mimetype.startsWith('audio/')) {
        newPost.audioUrl = fileUrl;
      }
    }

    posts.push(newPost);
    
    console.log('Post créé avec succès:', newPost);
    
    res.status(201).json({
      success: true,
      data: newPost
    });
  } catch (error) {
    console.error('Erreur création post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour liker un post
app.patch('/api/posts/:postId/vote', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    
    const post = posts.find(p => p._id === postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Toggle like
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Erreur vote post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes des commentaires
app.get('/api/posts/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const post = posts.find(p => p._id === postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      data: post.comments || []
    });
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

app.post('/api/posts/:postId/comments', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    
    const post = posts.find(p => p._id === postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    const user = users.find(u => u._id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const newComment = {
      _id: 'comment-' + Date.now(),
      author: {
        _id: user._id,
        name: user.name
      },
      content,
      createdAt: new Date().toISOString()
    };

    if (!post.comments) {
      post.comments = [];
    }
    post.comments.push(newComment);

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Erreur ajout commentaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes pour suivre/désuivre et suggestions
app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
  try {
    const followerId = req.user.userId;
    const followedId = req.params.id;

    if (followerId === followedId) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous suivre vous-même.' });
    }

    const follower = users.find(u => u._id === followerId);
    const followed = users.find(u => u._id === followedId);

    if (!follower || !followed) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    if (follower.following.includes(followedId)) {
      return res.status(400).json({ success: false, message: 'Vous suivez déjà cet utilisateur.' });
    }

    follower.following.push(followedId);
    followed.followers.push(followerId);

    console.log(`${follower.name} a commencé à suivre ${followed.name}`);

    res.json({ success: true, message: `Vous suivez maintenant ${followed.name}.`, following: follower.following });
  } catch (error) {
    console.error('Erreur follow:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/users/:id/unfollow', authenticateToken, (req, res) => {
  try {
    const followerId = req.user.userId;
    const followedId = req.params.id;

    const follower = users.find(u => u._id === followerId);
    const followed = users.find(u => u._id === followedId);

    if (!follower || !followed) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    if (!follower.following.includes(followedId)) {
      return res.status(400).json({ success: false, message: 'Vous ne suivez pas cet utilisateur.' });
    }

    follower.following = follower.following.filter(id => id !== followedId);
    followed.followers = followed.followers.filter(id => id !== followerId);

    console.log(`${follower.name} a arrêté de suivre ${followed.name}`);

    res.json({ success: true, message: `Vous ne suivez plus ${followed.name}.`, following: follower.following });
  } catch (error) {
    console.error('Erreur unfollow:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/users/suggestions', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentUser = users.find(u => u._id === currentUserId);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur actuel non trouvé.' });
    }

    const suggestions = users.filter(user =>
      user._id !== currentUserId && !currentUser.following.includes(user._id)
    ).map(({ _id, name, email, followers }) => ({ _id, name, email, followersCount: followers.length }));

    res.json({ success: true, data: suggestions.slice(0, 10) }); // Limite à 10 suggestions
  } catch (error) {
    console.error('Erreur suggestions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/users/following', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentUser = users.find(u => u._id === currentUserId);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur actuel non trouvé.' });
    }

    const followedUsers = users
      .filter(u => currentUser.following.includes(u._id))
      .map(({ _id, name, email }) => ({ _id, name, email }));

    res.json({ success: true, data: followedUsers });
  } catch (error) {
    console.error('Erreur récupération "following":', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Routes des notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: notifications.filter(n => n.userId === req.user.userId)
  });
});

// Routes des messages
app.get('/api/messages/conversations', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userConversations = conversations
      .filter(c => c.participants.includes(userId))
      .map(convo => {
        const otherParticipantId = convo.participants.find(pId => pId !== userId);
        const otherParticipant = users.find(u => u._id === otherParticipantId);
        return {
          ...convo,
          otherParticipant: {
            _id: otherParticipant?._id,
            name: otherParticipant?.name,
          }
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ success: true, data: userConversations });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/messages/:otherUserId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;

    const conversation = conversations.find(c =>
      c.participants.includes(userId) && c.participants.includes(otherUserId)
    );

    if (!conversation) {
      return res.json({ success: true, data: [] });
    }

    const conversationMessages = messages.filter(m => m.conversationId === conversation._id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({ success: true, data: conversationMessages });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content } = req.body;

    const sender = users.find(u => u._id === senderId);
    if (!sender.following.includes(receiverId)) {
      return res.status(403).json({ success: false, message: 'Vous devez suivre cette personne pour lui envoyer un message.' });
    }

    let conversation = conversations.find(c => c.participants.includes(senderId) && c.participants.includes(receiverId));

    if (!conversation) {
      conversation = { _id: 'convo-' + Date.now(), participants: [senderId, receiverId], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastMessage: null };
      conversations.push(conversation);
    }

    const newMessage = {
      _id: 'msg-' + Date.now(),
      conversationId: conversation._id,
      sender: { _id: sender._id, name: sender.name },
      content,
      createdAt: new Date().toISOString()
    };
    messages.push(newMessage);

    conversation.lastMessage = newMessage;
    conversation.updatedAt = new Date().toISOString();

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Profil de l'utilisateur courant
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u._id === req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      coverUrl: user.coverUrl || '',
      bio: user.bio || '',
      following: user.following || [],
      followers: user.followers || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer un utilisateur par ID
app.get('/api/users/:id', (req, res) => {
  try {
    const user = users.find(u => u._id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const postsCount = posts.filter(p => p.author && p.author._id === user._id).length;

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || '',
        coverUrl: user.coverUrl || '',
        bio: user.bio || '',
        stats: {
          posts: postsCount,
          followers: (user.followers || []).length,
          following: (user.following || []).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer les posts d'un utilisateur
app.get('/api/users/:id/posts', (req, res) => {
  try {
    const userId = req.params.id;
    const userPosts = posts
      .filter(p => p.author && p.author._id === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: userPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Liste des utilisateurs (pagination + recherche)
app.get('/api/users', (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const q = (req.query.q || '').toString().toLowerCase();

    let list = users;
    if (q) {
      list = list.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit).map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl || '',
      bio: u.bio || ''
    }));

    res.json({ success: true, data, page, limit, total, hasMore: start + limit < total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil (bio, avatar, cover)
app.patch('/api/users/:id', authenticateToken, upload.fields([{ name: 'avatar' }, { name: 'cover' }]), (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const user = users.find(u => u._id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (typeof req.body.bio === 'string') {
      user.bio = req.body.bio;
    }

    const files = req.files || {};
    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : undefined;
    const coverFile = Array.isArray(files.cover) ? files.cover[0] : undefined;

    if (avatarFile) {
      const fileUrl = `http://localhost:${PORT}/uploads/${avatarFile.filename}`;
      user.avatarUrl = fileUrl;
    }

    if (coverFile) {
      const fileUrl = `http://localhost:${PORT}/uploads/${coverFile.filename}`;
      user.coverUrl = fileUrl;
    }

    const postsCount = posts.filter(p => p.author && p.author._id === user._id).length;

    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      coverUrl: user.coverUrl || '',
      bio: user.bio || '',
      stats: {
        posts: postsCount,
        followers: (user.followers || []).length,
        following: (user.following || []).length
      }
    };

    return res.json({ success: true, data: responseUser });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend CultureBook fonctionne!',
    timestamp: new Date().toISOString(),
    posts: posts.length,
    users: users.length
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur CultureBook démarré sur http://localhost:${PORT}`);
  console.log(`📁 Dossier uploads: ${uploadsDir}`);
  console.log('📱 Fonctionnalités disponibles:');
  console.log('  ✅ Authentification (login/register)');
  console.log('  ✅ Publication de posts avec médias');
  console.log('  ✅ Upload d\'images, vidéos, audio');
  console.log('  ✅ Likes et commentaires');
  console.log('  ✅ Suivre des utilisateurs et suggestions');
  console.log('  ✅ Messagerie (uniquement avec les personnes suivies)');
  console.log('  ✅ API REST complète');
  console.log('\n🎯 Utilisateur de test:');
  console.log('  Email: demo@culturebook.com');
  console.log('  Mot de passe: n\'importe lequel');
});

module.exports = app;
