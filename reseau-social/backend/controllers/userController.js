const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
// ERREUR CORRIGÉE : Le modèle Notification n'était pas importé.
const Notification = require('../models/Notification'); // Assurez-vous que le chemin vers votre modèle est correct

// Base de données en mémoire pour le mode développement
const inMemoryUsers = [
    {
        _id: 'dev_user_1',
        name: 'Amadou Diallo',
        email: 'amadou@example.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=dev_user_1',
        bio: 'Passionné de contes traditionnels',
        followers: [],
        following: [],
        stats: { posts: 5, followers: 0, following: 0 }
    },
    {
        _id: 'dev_user_2',
        name: 'Fatou Camara',
        email: 'fatou@example.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=dev_user_2',
        bio: 'Conteuse et gardienne de la tradition orale',
        followers: [],
        following: [],
        stats: { posts: 3, followers: 0, following: 0 }
    },
    {
        _id: 'dev_user_3',
        name: 'Mamadou Sow',
        email: 'mamadou@example.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=dev_user_3',
        bio: 'Collectionneur de proverbes africains',
        followers: [],
        following: [],
        stats: { posts: 7, followers: 0, following: 0 }
    }
];

/**
 * @desc    Récupérer le profil d'un utilisateur
 * @route   GET /api/users/:id
 * @access  Public
 */
exports.getUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.params.id;

    if (process.env.NODE_ENV === 'development') {
        const user = inMemoryUsers.find(u => u._id === userId);
        if (!user) {
            return next(new ErrorResponse('Utilisateur non trouvé', 404));
        }
        return res.status(200).json({
            success: true,
            data: user
        });
    }

    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Récupérer des suggestions d'utilisateurs à suivre
 * @route   GET /api/users/suggestions
 * @access  Private
 */
exports.getUserSuggestions = asyncHandler(async (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // En mode développement, suggérer tous les utilisateurs sauf l'utilisateur actuel
        const suggestions = inMemoryUsers.filter(u => u._id !== req.user._id);
        return res.status(200).json({
            success: true,
            count: suggestions.length,
            data: suggestions
        });
    }

    // En production, trouver des utilisateurs que l'utilisateur actuel ne suit pas encore
    const currentUser = await User.findById(req.user.id);
    
    // Récupérer les IDs des utilisateurs que l'utilisateur actuel suit déjà
    const following = currentUser.following || [];
    
    // Trouver des utilisateurs qui ne sont pas suivis par l'utilisateur actuel
    const suggestions = await User.find({
        _id: { $ne: req.user.id, $nin: following },
    }).limit(10);

    res.status(200).json({
        success: true,
        count: suggestions.length,
        data: suggestions
    });
});

/**
 * @desc    Suivre un utilisateur
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
exports.followUser = asyncHandler(async (req, res, next) => {
    const userToFollowId = req.params.id;

    // Vérifier que l'utilisateur ne tente pas de se suivre lui-même
    if (userToFollowId === req.user.id) {
        return next(new ErrorResponse('Vous ne pouvez pas vous suivre vous-même', 400));
    }

    if (process.env.NODE_ENV === 'development') {
        const currentUserIndex = inMemoryUsers.findIndex(u => u._id === req.user._id);
        const userToFollowIndex = inMemoryUsers.findIndex(u => u._id === userToFollowId);

        if (userToFollowIndex === -1) {
            return next(new ErrorResponse('Utilisateur à suivre non trouvé', 404));
        }

        // Vérifier si l'utilisateur suit déjà cet utilisateur
        if (inMemoryUsers[currentUserIndex].following.includes(userToFollowId)) {
            return next(new ErrorResponse('Vous suivez déjà cet utilisateur', 400));
        }

        // Ajouter l'utilisateur à suivre à la liste des following de l'utilisateur actuel
        inMemoryUsers[currentUserIndex].following.push(userToFollowId);
        inMemoryUsers[currentUserIndex].stats.following += 1;

        // Ajouter l'utilisateur actuel à la liste des followers de l'utilisateur à suivre
        inMemoryUsers[userToFollowIndex].followers.push(req.user._id);
        inMemoryUsers[userToFollowIndex].stats.followers += 1;

        return res.status(200).json({
            success: true,
            data: inMemoryUsers[currentUserIndex]
        });
    }

    // En production, utiliser MongoDB
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
        return next(new ErrorResponse('Utilisateur à suivre non trouvé', 404));
    }

    const currentUser = await User.findById(req.user.id);

    // Vérifier si l'utilisateur suit déjà cet utilisateur
    if (currentUser.following.includes(userToFollowId)) {
        return next(new ErrorResponse('Vous suivez déjà cet utilisateur', 400));
    }

    // Ajouter l'utilisateur à suivre à la liste des following de l'utilisateur actuel
    // OPTIMISATION : On récupère l'utilisateur mis à jour directement
    const updatedCurrentUser = await User.findByIdAndUpdate(req.user.id, {
        $push: { following: userToFollowId },
        $inc: { 'stats.following': 1 }
    }, { new: true }); // { new: true } pour retourner le document mis à jour

    // Ajouter l'utilisateur actuel à la liste des followers de l'utilisateur à suivre
    await User.findByIdAndUpdate(userToFollowId, {
        $push: { followers: req.user.id },
        $inc: { 'stats.followers': 1 }
    });
    
    // Créer une notification pour l'utilisateur suivi
    await Notification.create({
        type: 'follow',
        recipient: userToFollowId, // L'utilisateur qui reçoit la notif
        sender: req.user.id,       // L'utilisateur qui a initié l'action
    });

    res.status(200).json({
        success: true,
        data: updatedCurrentUser
    });
});

/**
 * @desc    Ne plus suivre un utilisateur
 * @route   POST /api/users/:id/unfollow
 * @access  Private
 */
exports.unfollowUser = asyncHandler(async (req, res, next) => {
    const userToUnfollowId = req.params.id;

    if (process.env.NODE_ENV === 'development') {
        const currentUserIndex = inMemoryUsers.findIndex(u => u._id === req.user._id);
        const userToUnfollowIndex = inMemoryUsers.findIndex(u => u._id === userToUnfollowId);

        if (userToUnfollowIndex === -1) {
            return next(new ErrorResponse('Utilisateur à ne plus suivre non trouvé', 404));
        }

        // Vérifier si l'utilisateur suit cet utilisateur
        const followingIndex = inMemoryUsers[currentUserIndex].following.indexOf(userToUnfollowId);
        if (followingIndex === -1) {
            return next(new ErrorResponse('Vous ne suivez pas cet utilisateur', 400));
        }

        // Retirer l'utilisateur à ne plus suivre de la liste des following de l'utilisateur actuel
        inMemoryUsers[currentUserIndex].following.splice(followingIndex, 1);
        inMemoryUsers[currentUserIndex].stats.following -= 1;

        // Retirer l'utilisateur actuel de la liste des followers de l'utilisateur à ne plus suivre
        const followerIndex = inMemoryUsers[userToUnfollowIndex].followers.indexOf(req.user._id);
        // BUG CORRIGÉ : On ne modifie le tableau que si l'utilisateur est bien trouvé.
        if (followerIndex > -1) {
            inMemoryUsers[userToUnfollowIndex].followers.splice(followerIndex, 1);
            inMemoryUsers[userToUnfollowIndex].stats.followers -= 1;
        }

        return res.status(200).json({
            success: true,
            data: inMemoryUsers[currentUserIndex]
        });
    }

    // En production, utiliser MongoDB
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
        return next(new ErrorResponse('Utilisateur à ne plus suivre non trouvé', 404));
    }

    const currentUser = await User.findById(req.user.id);

    // Vérifier si l'utilisateur suit cet utilisateur
    if (!currentUser.following.includes(userToUnfollowId)) {
        return next(new ErrorResponse('Vous ne suivez pas cet utilisateur', 400));
    }

    // Retirer l'utilisateur à ne plus suivre de la liste des following de l'utilisateur actuel
    const updatedCurrentUser = await User.findByIdAndUpdate(req.user.id, {
        $pull: { following: userToUnfollowId },
        $inc: { 'stats.following': -1 }
    }, { new: true });

    // Retirer l'utilisateur actuel de la liste des followers de l'utilisateur à ne plus suivre
    await User.findByIdAndUpdate(userToUnfollowId, {
        $pull: { followers: req.user.id },
        $inc: { 'stats.followers': -1 }
    });
    
    res.status(200).json({
        success: true,
        data: updatedCurrentUser
    });
});