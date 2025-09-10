const Post = require('../models/Post');
const Commentaire = require('../models/Comment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Base de données en mémoire pour le mode développement
const inMemoryPosts = [];
let nextPostId = 1;

/**
 * @desc    Récupérer tous les posts
 * @route   GET /api/posts
 * @access  Public
 */
exports.getPosts = asyncHandler(async (req, res, next) => {
    // En mode développement, retourner des données en mémoire
    if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
            success: true,
            count: inMemoryPosts.length,
            data: inMemoryPosts
        });
    }
    
    // En production, utiliser MongoDB
    const posts = await Post.find().populate('author', 'name avatarUrl').sort({ createdAt: -1 });
    
    res.status(200).json({
        success: true,
        count: posts.length,
        data: posts
    });
});

/**
 * @desc    Créer un nouveau post
 * @route   POST /api/posts
 * @access  Private
 */
exports.creerPost = asyncHandler(async (req, res, next) => {
    console.log('Requête de création de post reçue');
    const { type, content } = req.body;
    
    if (!type || !content) {
        return next(new ErrorResponse('Le type et le contenu sont requis', 400));
    }
    
    let mediaType = 'none';
    let mediaUrl = '';

    // Gestion du fichier média s'il existe
    if (req.file) {
        const fileType = req.file.mimetype.split('/')[0];
        if (['image', 'video', 'audio'].includes(fileType)) {
            mediaType = fileType;
            mediaUrl = `/uploads/${req.file.filename}`;
        }
    }

    if (process.env.NODE_ENV === 'development') {
        const newPost = {
            _id: `dev_post_${nextPostId++}`,
            author: req.user,
            type,
            content,
            mediaType,
            mediaUrl,
            likes: [],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        inMemoryPosts.unshift(newPost);

        return res.status(201).json({
            success: true,
            data: newPost
        });
    }

    const postData = {
        author: req.user.id,
        type,
        content,
        mediaType,
        mediaUrl
    };

    const post = await Post.create(postData);

    res.status(201).json({
        success: true,
        data: post
    });

});

/**
 * @desc    Liker ou unliker un post
 * @route   PATCH /api/posts/:id/like
 * @access  Private
 */
exports.toggleLike = asyncHandler(async (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        const postIndex = inMemoryPosts.findIndex(p => p._id === req.params.id);
        
        if (postIndex === -1) {
            return next(new ErrorResponse('Post non trouvé', 404));
        }

        const post = inMemoryPosts[postIndex];
        const userId = req.user._id;
        const likeIndex = post.likes.findIndex(like => like === userId);

        if (likeIndex === -1) {
            // Ajouter le like
            post.likes.push(userId);
        } else {
            // Retirer le like
            post.likes.splice(likeIndex, 1);
        }

        return res.status(200).json({
            success: true,
            data: post
        });
    }

    // En production, utiliser MongoDB
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse('Post non trouvé', 404));
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
        // Ajouter le like
        post.likes.push(userId);

        // Créer une notification si l'auteur n'est pas l'utilisateur qui like
        if (post.author.toString() !== userId.toString()) {
            await Notification.create({
                type: 'like',
                user: post.author,
                fromUser: userId,
                post: post._id,
                message: `${req.user.name} a aimé votre publication`
            });
        }
    } else {
        // Retirer le like
        post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
        success: true,
        data: post
    });
});

/**
 * @desc    Récupérer les commentaires d'un post
 * @route   GET /api/posts/:id/comments
 * @access  Public
 */
exports.getCommentaires = asyncHandler(async (req, res, next) => {
    const postId = req.params.id;

    if (process.env.NODE_ENV === 'development') {
        const post = inMemoryPosts.find(p => p._id === postId);
        if (!post) {
            return next(new ErrorResponse('Post non trouvé', 404));
        }
        return res.status(200).json({
            success: true,
            count: post.comments.length,
            data: post.comments
        });
    }

    const commentaires = await Commentaire.find({ post: postId })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: commentaires.length,
        data: commentaires
    });
});

/**
 * @desc    Ajouter un commentaire à un post
 * @route   POST /api/posts/:id/comments
 * @access  Private
 */
exports.ajouterCommentaire = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    const postId = req.params.id;

    if (process.env.NODE_ENV === 'development') {
        const post = inMemoryPosts.find(p => p._id === postId);
        if (!post) {
            return next(new ErrorResponse('Post non trouvé', 404));
        }

        const newComment = {
            _id: `dev_comment_${Date.now()}`,
            content,
            author: req.user,
            post: postId,
            createdAt: new Date().toISOString()
        };

        post.comments.push(newComment);

        return res.status(201).json({
            success: true,
            data: newComment
        });
    }

    let commentaire = await Commentaire.create({
        content,
        author: req.user.id,
        post: postId
    });

    commentaire = await commentaire.populate('author', 'name avatarUrl');

    // Ajouter le commentaire à la liste des commentaires du post
    const post = await Post.findById(postId);
    post.comments.push(commentaire._id);
    await post.save();

    // Créer une notification si l'auteur n'est pas l'utilisateur qui commente
    if (post.author.toString() !== req.user.id) {
        await Notification.create({
            type: 'comment',
            user: post.author,
            fromUser: req.user.id,
            post: postId,
            message: `${req.user.name} a commenté votre publication`
        });
    }

    // Récupérer le post mis à jour avec tous les commentaires pour le renvoyer au client
    const updatedPost = await Post.findById(postId)
        .populate('author', 'name avatarUrl')
        .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'name avatarUrl'
            }
        });

    res.status(201).json({
        success: true,
        data: updatedPost
    });
});