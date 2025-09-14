const Post = require('../models/Post');
const Commentaire = require('../models/commentaire'); // Utilisation du modèle 'commentaire.js'
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Récupérer tous les posts (avec pagination)
 * @route   GET /api/posts
 * @access  Private
 */
exports.getPosts = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    // Récupérer les IDs des personnes suivies + ses propres posts
    const followingIds = req.user.following || [];
    const authorIds = [...followingIds, req.user._id];

    const total = await Post.countDocuments({ author: { $in: authorIds }, groupId: null });
    const posts = await Post.find({ author: { $in: authorIds }, groupId: null })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
        data: posts
    });
});

/**
 * @desc    Créer un nouveau post
 * @route   POST /api/posts
 * @access  Private
 */
exports.creerPost = asyncHandler(async (req, res, next) => {
    const { type, language, region, textContent } = req.body;

    const postData = {
        author: req.user.id,
        type,
        language,
        region,
        textContent,
        groupId: req.body.groupId || null,
    };

    if (req.file) {
        const fileType = req.file.mimetype;
        if (fileType.startsWith('image/')) {
            postData.imageUrl = `/uploads/${req.file.filename}`;
        } else if (fileType.startsWith('video/')) {
            postData.videoUrl = `/uploads/${req.file.filename}`;
        } else if (fileType.startsWith('audio/')) {
            postData.audioUrl = `/uploads/${req.file.filename}`;
        }
    }

    const post = await Post.create(postData);

    res.status(201).json({
        success: true,
        data: post
    });
});

/**
 * @desc    Liker ou unliker un post
 * @route   PATCH /api/posts/:id/vote
 * @access  Private
 */
exports.likerPost = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse(`Post non trouvé avec l'id ${req.params.id}`, 404));
    }

    const userId = req.user.id;
    const postAuthorId = post.author.toString();
    const isLiked = post.likes.some(like => like.toString() === userId);

    if (isLiked) {
        post.likes = post.likes.filter(like => like.toString() !== userId);
    } else {
        post.likes.push(userId);

        if (postAuthorId !== userId) {
            const notification = await Notification.create({
                recipient: postAuthorId,
                sender: userId,
                type: 'like',
                post: post._id,
            });

            const receiverSocketId = req.onlineUsers.get(postAuthorId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit('newNotification', {
                    message: `${req.user.name} a aimé votre publication.`,
                    notification,
                });
            }
        }
    }

    await post.save();
    
    res.status(200).json({
        success: true,
        data: post
    });
});

/**
 * @desc    Ajouter un commentaire à un post
 * @route   POST /api/posts/:id/comments
 * @access  Private
 */
exports.ajouterCommentaire = asyncHandler(async (req, res, next) => {
    const { content } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
        return next(new ErrorResponse(`Post non trouvé avec l'id ${req.params.id}`, 404));
    }

    if (!content || !content.trim()) {
        return next(new ErrorResponse('Le contenu du commentaire est requis', 400));
    }

    const comment = await Commentaire.create({
        user: req.user.id,
        content: content.trim(),
    });

    post.comments.push(comment._id);
    await post.save();

    // Créer une notification si l'auteur du post est différent de l'utilisateur courant
    const postAuthorId = post.author.toString();
    const userId = req.user.id;
    if (postAuthorId !== userId) {
        const notification = await Notification.create({
            recipient: postAuthorId,
            sender: userId,
            type: 'comment',
            post: post._id,
        });

        const receiverSocketId = req.onlineUsers.get(postAuthorId);
        if (receiverSocketId) {
            req.io.to(receiverSocketId).emit('newNotification', {
                message: `${req.user.name} a commenté votre publication.`,
                notification,
            });
        }
    }

    const populatedComment = await Commentaire.findById(comment._id).populate('user', 'name');

    res.status(201).json({
        success: true,
        data: populatedComment,
    });
});

/**
 * @desc    Récupérer les commentaires d'un post
 * @route   GET /api/posts/:id/comments
 * @access  Public
 */
exports.getCommentaires = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate({
        path: 'comments',
        populate: { path: 'user', select: 'name' },
    });

    if (!post) {
        return next(new ErrorResponse(`Post non trouvé avec l'id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        count: post.comments.length,
        data: post.comments,
    });
});

/**
 * @desc    Supprimer un post
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
exports.supprimerPost = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse(`Post non trouvé avec l'id ${req.params.id}`, 404));
    }

    // Vérifier que l'utilisateur est le propriétaire du post
    if (post.author.toString() !== req.user.id) {
        return next(new ErrorResponse('Non autorisé à supprimer ce post', 403));
    }

    // Supprimer tous les commentaires associés
    if (post.comments && post.comments.length > 0) {
        await Commentaire.deleteMany({ _id: { $in: post.comments } });
    }

    // Supprimer toutes les notifications associées
    await Notification.deleteMany({ post: post._id });

    // Supprimer le post
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Post supprimé avec succès'
    });
});
